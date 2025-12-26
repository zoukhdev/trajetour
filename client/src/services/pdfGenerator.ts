import html2pdf from 'html2pdf.js';
import type { Order, Client, Agency } from '../types';

// Helper function to create invoice HTML with inline fonts
const createInvoiceHTML = (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr'): string => {
    const isRTL = language === 'ar';

    const dateStr = new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR');

    // Calculate amounts
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amountDZD, 0);
    const remainingAmount = order.totalAmount - paidAmount;

    const t = (fr: string, ar: string) => isRTL ? ar : fr;

    // Use system fonts that work without loading
    const fontFamily = isRTL ? "Arial, 'Arial Unicode MS', sans-serif" : "Arial, Helvetica, sans-serif";

    return `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'fr'}">
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            padding: 30px;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            font-size: 14px;
            line-height: 1.6;
        }
        
        .header {
            border-bottom: 3px solid #1a56db;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .company-name {
            color: #1a56db;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .company-info {
            color: #64748b;
            font-size: 12px;
            line-height: 1.8;
        }
        
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 10px 0;
        }
        
        .invoice-meta {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 20px;
        }
        
        .section {
            background: #f9fafb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .section-content {
            font-size: 13px;
            color: #4b5563;
            line-height: 1.8;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th {
            background: #1a56db;
            color: white;
            padding: 15px 10px;
            text-align: ${isRTL ? 'right' : 'left'};
            font-size: 13px;
            font-weight: bold;
        }
        
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            margin: 30px 0;
            ${isRTL ? 'margin-right' : 'margin-left'}: 50%;
        }
        
        .total-line {
            padding: 10px 0;
            font-size: 15px;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .total-line.grand {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #1a56db;
            border-bottom: 2px solid #1a56db;
            padding-top: 15px;
        }
        
        .total-line.paid {
            color: #059669;
        }
        
        .total-line.remaining {
            color: ${remainingAmount > 0 ? '#dc2626' : '#059669'};
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${t('Wahat Alrajaa', 'واحة الرجاء')}</div>
        <div class="company-info">
            ${t('Tour Management & Travel Services', 'إدارة الرحلات والخدمات السياحية')}<br>
            ${t('Es-Senia, Oran - Algérie', 'السانية، وهران - الجزائر')}<br>
            ${t('Tél', 'هاتف')}: +213550323020<br>
            Email: contact@wahat-alrajaa.com
        </div>
    </div>
    
    <div class="invoice-title">${t('FACTURE', 'فاتورة')}</div>
    <div class="invoice-meta">
        <strong>${t('N°', 'رقم')}:</strong> CMD-${order.id.substr(0, 8).toUpperCase()}<br>
        <strong>${t('Date', 'تاريخ')}:</strong> ${dateStr}<br>
        <strong>${t('État', 'الحالة')}:</strong> ${order.status}
    </div>
    
    <div class="section">
        <div class="section-title">${t('Facturé à:', 'فوترة إلى:')}</div>
        <div class="section-content">
            <strong>${client.fullName}</strong><br>
            ${t('Tél', 'هاتف')}: ${client.mobileNumber}<br>
            ${client.passportNumber ? `${t('Passeport', 'جواز سفر')}: ${client.passportNumber}<br>` : ''}
            ${t('Type', 'نوع')}: ${client.type}
            ${agency ? `<br>${t('Agence/Rabbateur', 'وكالة/مسوق')}: ${agency.name}` : ''}
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>${t('Description', 'الوصف')}</th>
                <th class="text-center">${t('Qté', 'الكمية')}</th>
                <th class="text-right">${t('Prix Unit.', 'سعر الوحدة')}</th>
                <th class="text-right">${t('Montant', 'المبلغ')} (DZD)</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${item.amount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals-section">
        <div class="total-line grand">
            <span>${t('Total:', 'المجموع:')}</span>
            <span>${order.totalAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
        </div>
        <div class="total-line paid">
            <span>${t('Payé:', 'مدفوع:')}</span>
            <span>${paidAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
        </div>
        <div class="total-line remaining">
            <span>${t('Reste à payer:', 'الباقي:')}</span>
            <span>${remainingAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
        </div>
    </div>
    
    <div class="footer">
        ${t('Merci de votre confiance.', 'شكراً لثقتكم.')}<br>
        Wahat Alrajaa Tour - RC: XXXXX - NIF: XXXXX
    </div>
</body>
</html>
    `;
};

export const generateInvoice = async (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr') => {
    console.log('🔄 Starting PDF generation...', { language, orderId: order.id });

    let container: HTMLDivElement | null = null;

    try {
        // Create HTML
        const htmlContent = createInvoiceHTML(order, client, agency, language);
        console.log('✅ HTML created');

        // Create a full-screen white container that covers EVERYTHING
        // This is the most robust way to ensure html2canvas captures exactly what we see
        container = document.createElement('div');
        container.id = 'pdf-generation-container';
        container.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100vw; 
            height: 100vh; 
            background: #ffffff; 
            z-index: 999999; 
            overflow-y: auto;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        `;

        // The actual invoice wrapper
        // The actual invoice wrapper - Exact A4 dimensions at 96 DPI
        // Width: 210mm approx 794px
        // Height: 297mm approx 1123px (we allow auto-height but restrict for single page feeling)
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            width: 794px;
            min-height: 1123px;
            background: white; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            padding: 0;
            box-sizing: border-box;
            background-color: white;
        `;
        wrapper.innerHTML = htmlContent;

        container.appendChild(wrapper);
        document.body.appendChild(container); // Append to body to cover everything

        console.log('✅ Full screen container added');

        // Show a "Generating..." message on top
        const msg = document.createElement('div');
        msg.innerHTML = 'Génération du PDF...';
        msg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #2563eb; color: white; border-radius: 6px; font-family: system-ui; z-index: 1000000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 500;';
        document.body.appendChild(msg);

        // Substantial delay to ensure rendering is stable (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        const opt = {
            margin: [0, 0, 0, 0] as [number, number, number, number],
            filename: `Facture-${order.id.substr(0, 6)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: true,
                letterRendering: true,
                backgroundColor: '#ffffff'
                // Removed explicit width/windowWidth to let auto-scaling work better
            },
            jsPDF: {
                unit: 'mm' as const,
                format: 'a4' as const,
                orientation: 'portrait' as const,
                compress: true,
                hotfixes: ['px_scaling']
            }
        };

        console.log('🔄 Taking snapshot...');
        // Capture specific wrapper
        await html2pdf().set(opt).from(wrapper).save();
        console.log('✅ PDF generated successfully!');

        // Remove message
        if (msg.parentNode) msg.parentNode.removeChild(msg);

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
        // Clean up safely
        const cleanupContainer = document.getElementById('pdf-generation-container');
        if (cleanupContainer && cleanupContainer.parentNode) {
            cleanupContainer.parentNode.removeChild(cleanupContainer);
        }
    }
};
