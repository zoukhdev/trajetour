import type { Order, OrderStatus } from '../types';

export interface PaymentAllocationResult {
    orderId: string;
    amountAllocated: number;
    remainingBalance: number;
    newStatus: OrderStatus;
}

/**
 * Allocates a payment across agency orders using FIFO (First-In-First-Out) logic
 * 
 * @param payment - Payment details with amountDZD and agencyId
 * @param orders - All orders in the system
 * @returns Array of allocation results showing how payment was distributed
 * 
 * Logic:
 * 1. Filter orders for the specified agency with remaining balance > 0
 * 2. Sort by creation date (oldest first)
 * 3. Allocate payment amount starting from oldest order
 * 4. Update remaining balance and status for each affected order
 */
export function allocatePaymentFIFO(
    payment: { amountDZD: number; agencyId: string },
    orders: Order[]
): PaymentAllocationResult[] {
    // 1. Filter orders for this agency with remaining balance
    const unpaidOrders = orders
        .filter(o =>
            o.agencyId === payment.agencyId &&
            o.remainingBalanceDZD > 0
        )
        .sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

    // 2. Allocate payment FIFO
    let remainingPayment = payment.amountDZD;
    const allocations: PaymentAllocationResult[] = [];

    for (const order of unpaidOrders) {
        if (remainingPayment <= 0) break;

        // Calculate how much to allocate to this order
        const amountToAllocate = Math.min(
            remainingPayment,
            order.remainingBalanceDZD
        );

        // Calculate new remaining balance
        const newRemainingBalance = order.remainingBalanceDZD - amountToAllocate;

        // Determine new status based on remaining balance
        let newStatus: OrderStatus;
        if (newRemainingBalance === 0) {
            newStatus = 'Payé';
        } else if (newRemainingBalance < order.totalAmountDZD) {
            newStatus = 'Partiel';
        } else {
            newStatus = 'Non payé';
        }

        // Record this allocation
        allocations.push({
            orderId: order.id,
            amountAllocated: amountToAllocate,
            remainingBalance: newRemainingBalance,
            newStatus
        });

        // Reduce remaining payment amount
        remainingPayment -= amountToAllocate;
    }

    return allocations;
}

/**
 * Migrate existing orders to initialize remainingBalanceDZD
 * Run once after deployment
 * 
 * @param orders - Existing orders to migrate
 * @returns Orders with remainingBalanceDZD initialized
 */
export function migrateExistingOrders(orders: Order[]): Order[] {
    return orders.map(order => {
        // Calculate total paid from payments
        const totalPaid = order.payments.reduce((sum, p) => sum + p.amountDZD, 0);

        // Initialize remaining balance
        const remainingBalanceDZD = (order.totalAmountDZD || order.totalAmount) - totalPaid;

        return {
            ...order,
            remainingBalanceDZD
        };
    });
}
