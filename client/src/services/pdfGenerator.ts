import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, Client, Agency } from '../types';

export const generateInvoice = async (order: Order, client: Client, agency?: Agency, language: 'fr' | 'ar' = 'fr') => {
    const doc = new jsPDF();

    // NOTE: PDF generation is French-only because jsPDF doesn't support Arabic text encoding
    // Arabic characters display as garbled text (þ-þîþ—) with built-in fonts
    // For Arabic support, would need a custom font or different PDF library

    // Colors
    const primaryColor = [26, 86, 219]; // #1a56db (Blue-600)
    const grayColor = [100, 116, 139]; // #64748b (Slate-500)

    // Logo
    try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        doc.addImage(logoImg, 'PNG', 20, 10, 20, 20);
    } catch (error) {
        console.warn('Could not load logo:', error);
    }

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Wahat Alrajaa', 45, 20);

    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFont('helvetica', 'normal');

    const companyInfo = [
        'Tour Management & Travel Services',
        'Es-Senia, Oran - Algérie',
        'Tél: +213550323020',
        'Email: contact@wahat-alrajaa.com'
    ];

    companyInfo.forEach((line, i) => {
        doc.text(line, 45, 26 + (i * 5));
    });

    // Invoice Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 150, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const dateStr = new Date(order.createdAt).toLocaleDateString('fr-FR');
    const invoiceDetails = [
        `N°: CMD-${order.id.substr(0, 6).toUpperCase()}`,
        `Date: ${dateStr}`,
        `État: ${order.status}`
    ];

    invoiceDetails.forEach((line, i) => {
        doc.text(line, 150, 26 + (i * 5));
    });

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 50, 190, 50);

    // Client Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturé à:', 20, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(client.fullName, 20, 66);
    doc.text(`Tél: ${client.mobileNumber}`, 20, 71);

    let currentY = 76;
    if (client.passportNumber) {
        doc.text(`Passeport: ${client.passportNumber}`, 20, currentY);
        currentY += 5;
    }
    doc.text(`Type: ${client.type}`, 20, currentY);

    if (agency) {
        doc.text(`Agence/Rabbateur: ${agency.name}`, 120, 66);
    }

    // Items Table
    const tableColumn = ["Description", "Qté", "Prix Unit.", "Montant (DZD)"];

    const tableRows = order.items.map(item => {
        const amount = item.amount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
        const unitPrice = item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
        const quantity = item.quantity.toString();
        return [item.description, quantity, unitPrice, amount];
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
            halign: 'left'
        },
        headStyles: {
            fillColor: primaryColor as any,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Description
            1: { cellWidth: 20, halign: 'center' }, // Quantity
            2: { cellWidth: 30, halign: 'right' }, // Unit Price
            3: { cellWidth: 40, halign: 'right' } // Amount
        }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    doc.text('Total:', 140, finalY);
    doc.text(`${order.totalAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD`, 190, finalY, { align: 'right' });

    // Payments
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amountDZD, 0);
    const remainingAmount = order.totalAmount - paidAmount;

    doc.setFont('helvetica', 'normal');
    doc.text('Payé:', 140, finalY + 6);
    doc.text(`${paidAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD`, 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38); // Red
    } else {
        doc.setTextColor(22, 163, 74); // Green
    }

    doc.text('Reste à payer:', 140, finalY + 12);
    doc.text(`${remainingAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD`, 190, finalY + 12, { align: 'right' });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');

    doc.text('Merci de votre confiance.', 105, 280, { align: 'center' });
    doc.text('Wahat Alrajaa Tour - RC: XXXXX - NIF: XXXXX', 105, 285, { align: 'center' });

    // Save
    doc.save(`Facture-${order.id.substr(0, 6)}.pdf`);
};
