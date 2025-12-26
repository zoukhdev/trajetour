import html2pdf from 'html2pdf.js';
import type { Order, Client, Agency } from '../types';

// Helper function to create invoice HTML
const createInvoiceHTML = (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr'): string => {
    const isRTL = language === 'ar';

    const dateStr = new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR');

    // Calculate amounts
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amountDZD, 0);
    const remainingAmount = order.totalAmount - paidAmount;

    const t = (fr: string, ar: string) => isRTL ? ar : fr;

    return `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'fr'}">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${isRTL ? "'Tajawal', sans-serif" : "Arial, sans-serif"};
            padding: 20px;
            direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        
        .invoice {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        
        .company-info h1 {
            color: #1a56db;
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .company-info p {
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .invoice-details {
            text-align: ${isRTL ? 'left' : 'right'};
        }
        
        .invoice-details h2 {
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .invoice-details p {
            font-size: 12px;
            color: #64748b;
            margin: 3px 0;
        }
        
        .client-section {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .client-section h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .client-section p {
            font-size: 12px;
            color: #4b5563;
            margin: 3px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th {
            background: #1a56db;
            color: white;
            padding: 12px;
            text-align: ${isRTL ? 'right' : 'left'};
            font-size: 12px;
            font-weight: 700;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }
        
        .amount-col {
            text-align: right;
        }
        
        .totals {
            margin-top: 20px;
            ${isRTL ? 'margin-right' : 'margin-left'}: auto;
            width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        
        .total-row.main {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
        }
        
        .total-row.paid {
            color: #059669;
        }
        
        .total-row.remaining {
            color: ${remainingAmount > 0 ? '#dc2626' : '#059669'};
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="logo-section">
                <img src="/logo.png" alt="Logo" class="logo" />
                <div class="company-info">
                    <h1>${t('Wahat Alrajaa', 'واحة الرجاء')}</h1>
                    <p>${t('Tour Management & Travel Services', 'إدارة الرحلات والخدمات السياحية')}</p>
                    <p>${t('Es-Senia, Oran - Algérie', 'السانية، وهران - الجزائر')}</p>
                    <p>${t('Tél', 'هاتف')}: +213550323020</p>
                    <p>Email: contact@wahat-alrajaa.com</p>
                </div>
            </div>
            
            <div class="invoice-details">
                <h2>${t('FACTURE', 'فاتورة')}</h2>
                <p><strong>${t('N°', 'رقم')}:</strong> CMD-${order.id.substr(0, 8).toUpperCase()}</p>
                <p><strong>${t('Date', 'تاريخ')}:</strong> ${dateStr}</p>
                <p><strong>${t('État', 'الحالة')}:</strong> ${order.status}</p>
            </div>
        </div>
        
        <div class="client-section">
            <h3>${t('Facturé à:', 'فوترة إلى:')}</h3>
            <p><strong>${client.fullName}</strong></p>
            <p>${t('Tél', 'هاتف')}: ${client.mobileNumber}</p>
            ${client.passportNumber ? `<p>${t('Passeport', 'جواز سفر')}: ${client.passportNumber}</p>` : ''}
            <p>${t('Type', 'نوع')}: ${client.type}</p>
            ${agency ? `<p>${t('Agence/Rabbateur', 'وكالة/مسوق')}: ${agency.name}</p>` : ''}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>${t('Description', 'الوصف')}</th>
                    <th style="text-align: center">${t('Qté', 'الكمية')}</th>
                    <th class="amount-col">${t('Prix Unit.', 'سعر الوحدة')}</th>
                    <th class="amount-col">${t('Montant', 'المبلغ')} (DZD)</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td style="text-align: center">${item.quantity}</td>
                        <td class="amount-col">${item.unitPrice.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })}</td>
                        <td class="amount-col">${item.amount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-row main">
                <span>${t('Total:', 'المجموع:')}</span>
                <span>${order.totalAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
            </div>
            <div class="total-row paid">
                <span>${t('Payé:', 'مدفوع:')}</span>
                <span>${paidAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
            </div>
            <div class="total-row remaining">
                <span>${t('Reste à payer:', 'الباقي:')}</span>
                <span>${remainingAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
            </div>
        </div>
        
        <div class="footer">
            <p>${t('Merci de votre confiance.', 'شكراً لثقتكم.')}</p>
            <p>Wahat Alrajaa Tour - RC: XXXXX - NIF: XXXXX</p>
        </div>
    </div>
</body>
</html>
    `;
};

export const generateInvoice = async (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr') => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = createInvoiceHTML(order, client, agency, language);
    document.body.appendChild(container);

    // PDF options
    const opt = {
        margin: 10,
        filename: `Facture-${order.id.substr(0, 6)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    try {
        await html2pdf().set(opt).from(container).save();
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
};
