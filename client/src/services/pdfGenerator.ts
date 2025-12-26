import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, Client, Agency } from '../types';

export const generateInvoice = async (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr') => {
    const doc = new jsPDF();
    const isRTL = language === 'ar';

    // Note: For Arabic text, we use built-in fonts to avoid encoding issues
    // jsPDF will handle Arabic characters automatically with helvetica font

    // Colors
    const primaryColor = [26, 86, 219]; // #1a56db (Blue-600)
    const grayColor = [100, 116, 139]; // #64748b (Slate-500)

    // Helper for RTL text
    const alignX = (x: number) => isRTL ? 210 - x : x;
    // Simple approach: Flip X coordinates for layout blocks.

    // Logo (if available)
    try {
        // Add company logo to PDF
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        doc.addImage(logoImg, 'PNG', 20, 10, 20, 20);
    } catch (error) {
        // Logo not available, continue without it
        console.warn('Could not load logo:', error);
    }

    // Header (moved down to accommodate logo)
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    if (!isRTL) doc.setFont('helvetica', 'bold');
    doc.text(isRTL ? 'واحة الرجاء' : 'Wahat Alrajaa', alignX(45), 20, { align: isRTL ? 'right' : 'left' });

    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    if (!isRTL) doc.setFont('helvetica', 'normal');

    const companyInfo = [
        isRTL ? 'إدارة الرحلات والخدمات السياحية' : 'Tour Management & Travel Services',
        isRTL ? 'السانية، وهران - الجزائر' : 'Es-Senia, Oran - Algérie',
        isRTL ? 'هاتف: +213550323020' : 'Tél: +213550323020',
        isRTL ? 'بريد إلكتروني: contact@wahat-alrajaa.com' : 'Email: contact@wahat-alrajaa.com'
    ];

    companyInfo.forEach((line, i) => {
        doc.text(line, alignX(45), 26 + (i * 5), { align: isRTL ? 'right' : 'left' });
    });

    // Invoice Details (Right side in LTR, Left side in RTL)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    if (!isRTL) doc.setFont('helvetica', 'bold');
    doc.text(isRTL ? 'فاتورة' : 'FACTURE', alignX(150), 20, { align: isRTL ? 'left' : 'left' }); // 150 is right side. In RTL 210-150 = 60 (left side)

    doc.setFontSize(10);
    if (!isRTL) doc.setFont('helvetica', 'normal');

    const dateStr = new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-FR');
    const invoiceDetails = [
        `${isRTL ? 'رقم' : 'N°'}: CMD-${order.id.substr(0, 6).toUpperCase()}`,
        `${isRTL ? 'تاريخ' : 'Date'}: ${dateStr}`,
        `${isRTL ? 'الحالة' : 'État'}: ${order.status}`
    ];

    invoiceDetails.forEach((line, i) => {
        doc.text(line, alignX(150), 26 + (i * 5), { align: isRTL ? 'left' : 'left' });
    });

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 50, 190, 50);

    // Client Details
    doc.setFontSize(11);
    if (!isRTL) doc.setFont('helvetica', 'bold');
    doc.text(isRTL ? 'فوترة إلى:' : 'Facturé à:', alignX(20), 60, { align: isRTL ? 'right' : 'left' });

    doc.setFontSize(10);
    if (!isRTL) doc.setFont('helvetica', 'normal');

    doc.text(client.fullName, alignX(20), 66, { align: isRTL ? 'right' : 'left' });
    doc.text(`${isRTL ? 'هاتف' : 'Tél'}: ${client.mobileNumber}`, alignX(20), 71, { align: isRTL ? 'right' : 'left' });

    let currentY = 76;
    if (client.passportNumber) {
        doc.text(`${isRTL ? 'جواز سفر' : 'Passeport'}: ${client.passportNumber}`, alignX(20), currentY, { align: isRTL ? 'right' : 'left' });
        currentY += 5;
    }
    doc.text(`${isRTL ? 'نوع' : 'Type'}: ${client.type}`, alignX(20), currentY, { align: isRTL ? 'right' : 'left' });

    if (agency) {
        doc.text(`${isRTL ? 'وكالة/مسوق' : 'Agence/Rabbateur'}: ${agency.name}`, alignX(120), 66, { align: isRTL ? 'left' : 'left' });
    }

    // Items Table
    const tableColumn = isRTL
        ? ["المبلغ (DZD)", "سعر الوحدة", "الكمية", "الوصف"]
        : ["Description", "Qté", "Prix Unit.", "Montant (DZD)"];

    const tableRows = order.items.map(item => {
        const amount = item.amount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 });
        const unitPrice = item.unitPrice.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 });
        const quantity = item.quantity.toString();

        return isRTL
            ? [amount, unitPrice, quantity, item.description]
            : [item.description, quantity, unitPrice, amount];
    });

    autoTable(doc, {
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 3,
            halign: isRTL ? 'right' : 'left'
        },
        headStyles: {
            fillColor: primaryColor as any,
            textColor: [255, 255, 255],
            fontStyle: isRTL ? 'normal' : 'bold',
            halign: isRTL ? 'right' : 'left'
        },
        columnStyles: isRTL ? {
            0: { cellWidth: 40, halign: 'left' }, // Amount
            1: { cellWidth: 30, halign: 'center' }, // Unit Price
            2: { cellWidth: 20, halign: 'center' }, // Quantity
            3: { cellWidth: 'auto', halign: 'right' } // Description
        } : {
            0: { cellWidth: 'auto' }, // Description
            1: { cellWidth: 20, halign: 'center' }, // Quantity
            2: { cellWidth: 30, halign: 'right' }, // Unit Price
            3: { cellWidth: 40, halign: 'right' } // Amount
        }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalLabelX = isRTL ? 70 : 140;
    const totalValueX = isRTL ? 20 : 190;

    doc.setFontSize(10);
    if (!isRTL) doc.setFont('helvetica', 'bold');

    const totalText = isRTL ? 'المجموع:' : 'Total:';
    doc.text(totalText, totalLabelX, finalY, { align: isRTL ? 'right' : 'left' });
    doc.text(`${order.totalAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD`, totalValueX, finalY, { align: isRTL ? 'left' : 'right' });

    // Payments
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amountDZD, 0);
    const remainingAmount = order.totalAmount - paidAmount;

    if (!isRTL) doc.setFont('helvetica', 'normal');
    const paidText = isRTL ? 'مدفوع:' : 'Payé:';
    doc.text(paidText, totalLabelX, finalY + 6, { align: isRTL ? 'right' : 'left' });
    doc.text(`${paidAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD`, totalValueX, finalY + 6, { align: isRTL ? 'left' : 'right' });

    if (!isRTL) doc.setFont('helvetica', 'bold');
    if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38); // Red
    } else {
        doc.setTextColor(22, 163, 74); // Green
    }

    const remainingText = isRTL ? 'الباقي:' : 'Reste à payer:';
    doc.text(remainingText, totalLabelX, finalY + 12, { align: isRTL ? 'right' : 'left' });
    doc.text(`${remainingAmount.toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ', { minimumFractionDigits: 2 })} DZD`, totalValueX, finalY + 12, { align: isRTL ? 'left' : 'right' });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    if (!isRTL) doc.setFont('helvetica', 'italic');

    const footerText = isRTL ? 'شكرا لثقتكم.' : 'Merci de votre confiance.';
    doc.text(footerText, 105, 280, { align: 'center' });
    doc.text('Wahat Alrajaa Tour - RC: XXXXX - NIF: XXXXX', 105, 285, { align: 'center' });

    // Save
    doc.save(`Facture-${order.id.substr(0, 6)}.pdf`);
};
