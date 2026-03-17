-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    category TEXT CHECK (category IN ('order', 'payment', 'document', 'system')),
    related_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    related_payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_category TEXT DEFAULT NULL,
    p_related_order_id UUID DEFAULT NULL,
    p_related_payment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, category, related_order_id, related_payment_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_category, p_related_order_id, p_related_payment_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change() RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get the user_id from the order (creator or agency)
    SELECT created_by INTO v_user_id FROM orders WHERE id = NEW.id;
    
    -- Only notify if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        v_title := 'Changement de statut de commande';
        v_message := format('La commande #%s est maintenant: %s', NEW.reference, NEW.status);
        
        PERFORM create_notification(
            v_user_id,
            v_title,
            v_message,
            CASE 
                WHEN NEW.status IN ('confirmed', 'completed') THEN 'success'
                WHEN NEW.status = 'cancelled' THEN 'error'
                ELSE 'info'
            END,
            'order',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF NOT EXISTS trigger_order_status_notification ON orders;
CREATE TRIGGER trigger_order_status_notification
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();

-- Trigger function for payment validation
CREATE OR REPLACE FUNCTION notify_payment_validation() RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_order_ref TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Only notify if validation status changed
    IF (TG_OP = 'UPDATE' AND OLD.is_validated IS DISTINCT FROM NEW.is_validated AND NEW.is_validated IS NOT NULL) THEN
        -- Get user_id and order reference
        SELECT o.created_by, o.reference 
        INTO v_user_id, v_order_ref
        FROM orders o
        WHERE o.id = NEW.order_id;
        
        IF NEW.is_validated = TRUE THEN
            v_title := 'Paiement validé';
            v_message := format('Votre paiement de %s DA pour la commande #%s a été validé.', 
                              NEW.amount, v_order_ref);
        ELSE
            v_title := 'Paiement refusé';
            v_message := format('Votre paiement de %s DA pour la commande #%s a été refusé. Veuillez contacter le support.', 
                              NEW.amount, v_order_ref);
        END IF;
        
        PERFORM create_notification(
            v_user_id,
            v_title,
            v_message,
            CASE WHEN NEW.is_validated THEN 'success' ELSE 'warning' END,
            'payment',
            NEW.order_id,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment validation
DROP TRIGGER IF NOT EXISTS trigger_payment_validation_notification ON payments;
CREATE TRIGGER trigger_payment_validation_notification
AFTER UPDATE OF is_validated ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_validation();
