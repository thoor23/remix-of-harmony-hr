import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InternalInvoice } from '@/types/invoice';

export function generateInvoicePdf(invoice: InternalInvoice, companyName?: string, companyLogo?: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  let yPos = 20;

  // Header - Company Logo/Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName || 'Company Name', 14, yPos);

  // Invoice Title
  doc.setFontSize(28);
  doc.setTextColor(100, 100, 100);
  doc.text('INVOICE', pageWidth - 14, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos += 15;

  // Invoice Number & Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 14, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });

  yPos += 10;

  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    draft: [156, 163, 175],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128],
  };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setFillColor(...statusColor);
  const statusText = invoice.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 10;
  doc.roundedRect(pageWidth - 14 - statusWidth, yPos - 5, statusWidth, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - 14 - statusWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  yPos += 15;

  // From and To sections
  const fromX = 14;
  const toX = pageWidth / 2 + 10;

  // From Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', fromX, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (invoice.from_location) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.from_location.name, fromX, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.text(`Code: ${invoice.from_location.code}`, fromX, yPos);
    yPos += 5;
    doc.text(`Type: ${invoice.from_location.type === 'store' ? 'Store' : 'Office'}`, fromX, yPos);
    
    const fromLoc = invoice.from_location as any;
    if (fromLoc.address_street) {
      yPos += 5;
      doc.text(fromLoc.address_street, fromX, yPos);
    }
    if (fromLoc.address_city || fromLoc.address_state) {
      yPos += 5;
      doc.text(`${fromLoc.address_city || ''}${fromLoc.address_city && fromLoc.address_state ? ', ' : ''}${fromLoc.address_state || ''} ${fromLoc.address_zip_code || ''}`, fromX, yPos);
    }
    if (fromLoc.phone) {
      yPos += 5;
      doc.text(`Phone: ${fromLoc.phone}`, fromX, yPos);
    }
    if (fromLoc.email) {
      yPos += 5;
      doc.text(`Email: ${fromLoc.email}`, fromX, yPos);
    }
  }

  // To Section (reset yPos to align with From)
  let toYPos = yPos - (invoice.from_location ? 30 : 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TO:', toX, toYPos);
  toYPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (invoice.to_location) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.to_location.name, toX, toYPos);
    doc.setFont('helvetica', 'normal');
    toYPos += 5;
    doc.text(`Code: ${invoice.to_location.code}`, toX, toYPos);
    toYPos += 5;
    doc.text(`Type: ${invoice.to_location.type === 'store' ? 'Store' : 'Office'}`, toX, toYPos);

    const toLoc = invoice.to_location as any;
    if (toLoc.address_street) {
      toYPos += 5;
      doc.text(toLoc.address_street, toX, toYPos);
    }
    if (toLoc.address_city || toLoc.address_state) {
      toYPos += 5;
      doc.text(`${toLoc.address_city || ''}${toLoc.address_city && toLoc.address_state ? ', ' : ''}${toLoc.address_state || ''} ${toLoc.address_zip_code || ''}`, toX, toYPos);
    }
    if (toLoc.phone) {
      toYPos += 5;
      doc.text(`Phone: ${toLoc.phone}`, toX, toYPos);
    }
    if (toLoc.email) {
      toYPos += 5;
      doc.text(`Email: ${toLoc.email}`, toX, toYPos);
    }
  }

  yPos = Math.max(yPos, toYPos) + 15;

  // Invoice Type
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const invoiceTypeLabels: Record<string, string> = {
    expense_reimbursement: 'Expense Reimbursement',
    internal_service: 'Internal Service',
    goods_transfer: 'Goods Transfer',
  };
  doc.text(`Invoice Type: ${invoiceTypeLabels[invoice.invoice_type] || invoice.invoice_type}`, 14, yPos);

  yPos += 10;

  // Line Items Table
  const tableData = invoice.items?.map(item => [
    item.category?.name || 'N/A',
    item.description,
    item.quantity.toString(),
    `₹${Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
  ]) || [];

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  const totalsX = pageWidth - 80;
  const totalsValueX = pageWidth - 14;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`₹${Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsValueX, yPos, { align: 'right' });

  if (invoice.tax_rate > 0) {
    yPos += 6;
    doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, yPos);
    doc.text(`₹${Number(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsValueX, yPos, { align: 'right' });
  }

  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX - 5, yPos - 2, totalsValueX, yPos - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, yPos + 4);
  doc.text(`₹${Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsValueX, yPos + 4, { align: 'right' });

  yPos += 20;

  // Notes Section
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(noteLines, 14, yPos);
    yPos += noteLines.length * 5 + 10;
  }

  // Payment Info
  if (invoice.status === 'paid' && invoice.paid_at) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('PAID', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Paid on: ${new Date(invoice.paid_at).toLocaleDateString()}`, 14, yPos);
    if (invoice.payment_reference) {
      yPos += 5;
      doc.text(`Reference: ${invoice.payment_reference}`, 14, yPos);
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 5, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(invoice: InternalInvoice, companyName?: string): void {
  const doc = generateInvoicePdf(invoice, companyName);
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
}
