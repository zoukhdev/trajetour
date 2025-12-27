import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Order, Client, Agency } from '../types';

// Ported from client/src/services/pdfGenerator.ts
const createInvoiceHTML = (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr'): string => {
    const isRTL = language === 'ar';

    const dateStr = new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR');

    // Calculate amounts
    const paidAmount = (order.payments || []).reduce((sum, p) => sum + p.amountDZD, 0);
    const remainingAmount = order.totalAmountDZD - paidAmount;

    const t = (fr: string, ar: string) => isRTL ? ar : fr;

    // Use system fonts that work without loading
    const fontFamily = isRTL ? "Arial, 'Arial Unicode MS', sans-serif" : "Arial, Helvetica, sans-serif";

    // Logo might need to be a base64 or absolute URL. 
    // Since we are on mobile, we'll try to use the hosted logo if possible.
    const logoUrl = 'https://wahatalrajaa3.onrender.com/logo.png';

    return `
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body { 
                font-family: ${fontFamily};
                -webkit-print-color-adjust: exact;
                background: white;
            }
            .invoice-container {
                padding: 50px;
                direction: ${isRTL ? 'rtl' : 'ltr'};
                font-size: 14px;
                line-height: 1.5;
                background: white;
                color: #333;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .invoice-header-wrapper {
                display: flex;
                flex-direction: ${isRTL ? 'row-reverse' : 'row'};
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 3px solid #1a56db;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }

            .header-content {
                flex: 1;
                text-align: ${isRTL ? 'right' : 'left'};
            }
            
            .logo-container {
                margin-${isRTL ? 'right' : 'left'}: 20px;
            }

            .logo {
                height: 60px;
                width: auto;
                object-fit: contain;
            }
            
            .company-name {
                color: #1a56db;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .company-info {
                color: #64748b;
                font-size: 11px;
                line-height: 1.4;
            }
            
            .invoice-title-row {
                display: flex;
                flex-direction: ${isRTL ? 'row-reverse' : 'row'};
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }

            .invoice-title {
                font-size: 22px;
                font-weight: bold;
                margin: 0;
                color: #1f2937;
            }
            
            .invoice-meta {
                font-size: 12px;
                color: #4b5563;
                text-align: ${isRTL ? 'right' : 'left'};
            }
            
            .section {
                background: #f8fafc;
                padding: 12px 15px;
                margin: 15px 0;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }
            
            .section-title {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #334155;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                text-align: ${isRTL ? 'right' : 'left'};
            }
            
            .section-content {
                font-size: 12px;
                color: #475569;
                text-align: ${isRTL ? 'right' : 'left'};
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            th {
                background: #1a56db;
                color: white;
                padding: 8px 10px;
                text-align: ${isRTL ? 'right' : 'left'};
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            td {
                padding: 8px 10px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 12px;
            }
            
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            
            .totals-section {
                margin-top: 20px;
                margin-bottom: 20px;
                width: 50%;
                margin-${isRTL ? 'right' : 'left'}: auto;
            }
            
            .total-line {
                padding: 6px 0;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                flex-direction: ${isRTL ? 'row-reverse' : 'row'};
                border-bottom: 1px solid #e2e8f0;
            }
            
            .total-line.grand {
                font-size: 16px;
                font-weight: bold;
                border-top: 2px solid #1a56db;
                border-bottom: 2px solid #1a56db;
                padding: 10px 0;
                margin-top: 5px;
                color: #1e293b;
            }
            
            .total-line.paid { color: #059669; }
            .total-line.remaining { 
                color: ${remainingAmount > 0 ? '#dc2626' : '#059669'};
                font-weight: 600;
            }
            
            .footer {
                margin-top: 30px;
                text-align: center;
                color: #94a3b8;
                font-size: 10px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header-wrapper">
                <div class="header-content">
                    <div class="company-name">${t('Wahat Alrajaa', 'واحة الرجاء')}</div>
                    <div class="company-info">
                        ${t('Tour Management & Travel Services', 'إدارة الرحلات والخدمات السياحية')}<br>
                        ${t('Es-Senia, Oran - Algérie', 'السانية، وهران - الجزائر')}<br>
                        ${t('Tél', 'هاتف')}: +213550323020<br>
                        Email: contact@wahat-alrajaa.com
                    </div>
                </div>
                <div class="logo-container">
                    <img src="${logoUrl}" alt="Logo" class="logo" />
                </div>
            </div>
            
            <div class="invoice-title-row">
                <div class="header-content">
                    <div class="invoice-title">${t('FACTURE', 'فاتورة')}</div>
                    <div class="invoice-meta">
                        <strong>${t('N°', 'رقم')}:</strong> ${order.reference || `CMD-${order.id.substr(0, 8).toUpperCase()}`}<br>
                        <strong>${t('Date', 'تاريخ')}:</strong> ${dateStr}<br>
                        <strong>${t('État', 'الحالة')}:</strong> ${order.status}
                    </div>
                </div>
                
                <div class="section" style="margin: 0; min-width: 200px;">
                    <div class="section-title">${t('Facturé à:', 'فوترة إلى:')}</div>
                    <div class="section-content">
                        <strong>${client.fullName}</strong><br>
                        ${t('Tél', 'هاتف')}: ${client.mobileNumber}<br>
                        ${client.passportNumber ? `${t('Passeport', 'جواز سفر')}: ${client.passportNumber}<br>` : ''}
                        ${t('Type', 'نوع')}: ${client.type}
                    </div>
                </div>
            </div>

            <!-- Passengers Section -->
            ${order.passengers && order.passengers.length > 0 ? `
                <div class="section">
                    <div class="section-title">${t('Liste des Passagers', 'قائمة المسافرين')}</div>
                    <div class="section-content">
                        <table style="margin: 5px 0 0 0;">
                            <thead>
                                <tr>
                                    <th>${t('Nom Complet', 'الاسم الكامل')}</th>
                                    <th>${t('Passeport', 'جواز سفر')}</th>
                                    <th class="text-center">${t('Type', 'النوع')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.passengers.map(p => `
                                    <tr>
                                        <td>${p.firstName} ${p.lastName}</td>
                                        <td>${p.passportNumber || '-'}</td>
                                        <td class="text-center">${p.ageCategory || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
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
                            <td class="text-right">${item.unitPrice.toLocaleString('fr-DZ')}</td>
                            <td class="text-right">${item.amount.toLocaleString('fr-DZ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="total-line grand">
                    <span>${t('Total:', 'المجموع:')}</span>
                    <span>${order.totalAmountDZD.toLocaleString('fr-DZ')} DZD</span>
                </div>
                <div class="total-line paid">
                    <span>${t('Payé:', 'مدفوع:')}</span>
                    <span>${paidAmount.toLocaleString('fr-DZ')} DZD</span>
                </div>
                <div class="total-line remaining">
                    <span>${t('Reste à payer:', 'الباقي:')}</span>
                    <span>${remainingAmount.toLocaleString('fr-DZ')} DZD</span>
                </div>
            </div>
            
            <div class="footer">
                ${t('Merci de votre confiance.', 'شكراً لثقتكم.')}<br>
                Wahat Alrajaa Tour
            </div>
        </div>
    </body>
    </html>
    `;
};

export const generateInvoicePDF = async (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr') => {
    try {
        const html = createInvoiceHTML(order, client, agency, language);

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false
        });

        console.log('PDF generated at:', uri);

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Facture_${order.reference || order.id.substr(0, 8)}`,
            UTI: 'com.adobe.pdf'
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
