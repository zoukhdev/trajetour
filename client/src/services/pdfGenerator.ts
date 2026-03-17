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
    <style>
        .invoice-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        .invoice-container {
            font-family: ${fontFamily};
            padding: 60px; /* Increased padding on all sides */
            direction: ${isRTL ? 'rtl' : 'ltr'};
            font-size: 14px;
            line-height: 1.6;
            background: white;
            color: #333;
            width: 100%;
            min-height: 1123px;
        }
        
        .invoice-container .invoice-header-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1a56db;
            padding-bottom: 20px;
            margin-bottom: 30px;
            direction: ${isRTL ? 'rtl' : 'ltr'};
        }

        .invoice-container .header-content {
            flex: 1;
        }
        
        .invoice-container .logo-container {
            margin-${isRTL ? 'right' : 'left'}: 20px;
        }

        .invoice-container .logo {
            height: 80px;
            width: auto;
            object-fit: contain;
        }
        
        .invoice-container .company-name {
            color: #1a56db;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .invoice-container .company-info {
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .invoice-container .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #1f2937;
        }
        
        .invoice-container .invoice-meta {
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 25px;
        }
        
        .invoice-container .section {
            background: #f8fafc;
            padding: 15px 20px;
            margin: 15px 0;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            break-inside: avoid;
        }
        
        .invoice-container .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .invoice-container .section-content {
            font-size: 13px;
            color: #475569;
        }
        
        .invoice-container table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .invoice-container th {
            background: #1a56db;
            color: white;
            padding: 10px 12px;
            text-align: ${isRTL ? 'right' : 'left'};
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .invoice-container td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        
        .invoice-container tr:last-child td {
            border-bottom: none;
        }
        
        .invoice-container .text-right {
            text-align: right;
        }
        
        .invoice-container .text-center {
            text-align: center;
        }
        
        .invoice-container .totals-section {
            margin-top: 30px;
            margin-bottom: 30px;
            width: 50%;
            margin-${isRTL ? 'right' : 'left'}: auto;
            break-inside: avoid;
        }
        
        .invoice-container .total-line {
            padding: 8px 0;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .invoice-container .total-line.grand {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #1a56db;
            border-bottom: 2px solid #1a56db;
            padding: 12px 0;
            margin-top: 5px;
            color: #1e293b;
        }
        
        .invoice-container .total-line.paid {
            color: #059669;
        }
        
        .invoice-container .total-line.remaining {
            color: ${remainingAmount > 0 ? '#dc2626' : '#059669'};
            font-weight: 600;
        }
        
        .invoice-container .footer {
            margin-top: 40px;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            break-inside: avoid;
        }
    </style>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header-wrapper">
            <div class="header-content">
                <div class="company-name">${t('Trajetour', 'تراجيتور')}</div>
                <div class="company-info">
                    ${t('Tour Management & Travel Services', 'إدارة الرحلات والخدمات السياحية')}<br>
                    ${t('Es-Senia, Oran - Algérie', 'السانية، وهران - الجزائر')}<br>
                    ${t('Tél', 'هاتف')}: +213550323020<br>
                    Email: contact@trajetour.com
                </div>
            </div>
            <div class="logo-container">
                <img src="/logo.png" alt="Logo" class="logo" crossorigin="anonymous" />
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
                <div class="invoice-title" style="margin: 0;">${t('FACTURE', 'فاتورة')}</div>
                <div class="invoice-meta">
                    <strong>${t('N°', 'رقم')}:</strong> CMD-${order.id.substr(0, 8).toUpperCase()}<br>
                    <strong>${t('Date', 'تاريخ')}:</strong> ${dateStr}<br>
                    <strong>${t('État', 'الحالة')}:</strong> ${order.status}
                </div>
            </div>
            
            <div class="section" style="margin: 0; min-width: 250px;">
                <div class="section-title">${t('Facturé à:', 'فوترة إلى:')}</div>
                <div class="section-content">
                    <strong>${client.fullName}</strong><br>
                    ${t('Tél', 'هاتف')}: ${client.mobileNumber}<br>
                    ${client.passportNumber ? `${t('Passeport', 'جواز سفر')}: ${client.passportNumber}<br>` : ''}
                    ${t('Type', 'نوع')}: ${client.type}
                    ${agency ? `<br>${t('Agence/Rabbateur', 'وكالة/مسوق')}: ${agency.name}` : ''}
                </div>
            </div>
        </div>

        <!-- Passengers Section -->
        ${order.passengers && order.passengers.length > 0 ? `
            <div class="section">
                <div class="section-title">${t('Liste des Passagers', 'قائمة المسافرين')}</div>
                <div class="section-content">
                    <table style="margin: 10px 0 0 0; background: transparent;">
                        <thead style="background: rgba(26, 86, 219, 0.05);">
                            <tr>
                                <th style="background: transparent; color: #1a56db; border-bottom: 2px solid #1a56db;">${t('Nom Completo', 'الاسم الكامل')}</th>
                                <th style="background: transparent; color: #1a56db; border-bottom: 2px solid #1a56db;">${t('Passeport', 'جواز سفر')}</th>
                                <th style="background: transparent; color: #1a56db; border-bottom: 2px solid #1a56db;" class="text-center">${t('Type', 'النوع')}</th>
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
        
        <table style="margin-top: 10px;">
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
            Trajetour - RC: XXXXX - NIF: XXXXX
        </div>
    </div>
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
        container = document.createElement('div');
        container.id = 'pdf-generation-container';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #ffffff; z-index: 999999; overflow-y: auto; padding: 0; margin: 0; display: flex; justify-content: center; align-items: flex-start;';

        // The actual invoice wrapper - Exact A4 dimensions at 96 DPI
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width: 794px; min-height: 1123px; background: white; position: relative; padding: 0; margin: 0; box-sizing: border-box;';
        wrapper.innerHTML = htmlContent;

        container.appendChild(wrapper);
        document.body.appendChild(container);

        console.log('✅ Full screen container added');

        const msg = document.createElement('div');
        msg.innerHTML = 'Génération du PDF...';
        msg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #2563eb; color: white; border-radius: 6px; font-family: system-ui; z-index: 1000000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 500;';
        document.body.appendChild(msg);

        // Increase delay for logo and passenger list rendering
        await new Promise(resolve => setTimeout(resolve, 3000));

        const opt = {
            margin: 0,
            filename: `Facture-${order.id.substr(0, 6)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                width: 794,
                windowWidth: 794
            },
            jsPDF: {
                unit: 'px' as const,
                format: [794, 1123] as [number, number],
                orientation: 'portrait' as const,
                compress: true,
                hotfixes: ['px_scaling']
            }
        };

        console.log('🔄 Taking snapshot...');
        // @ts-ignore
        await html2pdf().set(opt).from(wrapper).save();
        console.log('✅ PDF generated successfully!');

        if (msg.parentNode) msg.parentNode.removeChild(msg);

    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        alert(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
        const cleanupContainer = document.getElementById('pdf-generation-container');
        if (cleanupContainer && cleanupContainer.parentNode) {
            cleanupContainer.parentNode.removeChild(cleanupContainer);
        }
    }
};
