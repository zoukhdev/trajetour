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

    try {
        // Create HTML
        const htmlContent = createInvoiceHTML(order, client, agency, language);
        console.log('✅ HTML created');

        // Create temporary container
        const container = document.createElement('div');
        container.style.cssText = 'position: absolute; left: -9999px; width: 210mm; background: white;';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        console.log('✅ Container added to DOM');

        // Small delay for rendering
        await new Promise(resolve => setTimeout(resolve, 100));

        // PDF options
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Facture-${order.id.substr(0, 6)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.95 },
            html2canvas: {
                scale: 2,
                useCORS: false,
                logging: true,
                letterRendering: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm' as const,
                format: 'a4' as const,
                orientation: 'portrait' as const,
                compress: true
            }
        };

        console.log('🔄 Generating PDF...');
        await html2pdf().set(opt).from(container).save();
        console.log('✅ PDF generated successfully!');

        // Clean up
        document.body.removeChild(container);
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        throw error;
    }
};
