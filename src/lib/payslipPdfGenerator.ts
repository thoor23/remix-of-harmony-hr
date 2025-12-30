import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayslipData {
  employee_name: string;
  employee_id: string;
  department: string;
  designation: string;
  pay_period: string;
  pay_date: string;
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
  hra?: number;
  transport_allowance?: number;
  medical_allowance?: number;
  other_allowances?: number;
  pf_deduction?: number;
  tax_deduction?: number;
  other_deductions?: number;
}

interface CompanyInfo {
  name: string;
  address: string;
  logo_url?: string;
}

export function generatePayslipPDF(payslip: PayslipData, company: CompanyInfo): void {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name || 'Company Name', 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.address || 'Company Address', 15, 27);
  
  // Payslip Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 165, 22);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Pay Period Box
  doc.setFillColor(245, 247, 250);
  doc.rect(15, 42, 180, 18, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pay Period: ${formatPayPeriod(payslip.pay_period)}`, 20, 52);
  doc.text(`Pay Date: ${formatDate(payslip.pay_date)}`, 130, 52);
  
  // Employee Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Employee Information', 15, 72);
  
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 75, 195, 75);
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoY = 83;
  doc.text('Employee Name:', 15, infoY);
  doc.text('Employee ID:', 15, infoY + 8);
  doc.text('Department:', 110, infoY);
  doc.text('Designation:', 110, infoY + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(payslip.employee_name, 55, infoY);
  doc.text(payslip.employee_id, 55, infoY + 8);
  doc.text(payslip.department || 'N/A', 145, infoY);
  doc.text(payslip.designation || 'N/A', 145, infoY + 8);
  
  // Earnings & Deductions Tables
  const tableStartY = 105;
  
  // Earnings Table
  const earnings = [
    ['Basic Salary', formatCurrency(payslip.basic_salary)],
    ['HRA', formatCurrency(payslip.hra || 0)],
    ['Transport Allowance', formatCurrency(payslip.transport_allowance || 0)],
    ['Medical Allowance', formatCurrency(payslip.medical_allowance || 0)],
    ['Other Allowances', formatCurrency(payslip.other_allowances || 0)],
  ];
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Earnings', 'Amount']],
    body: earnings,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 15 },
    tableWidth: 85,
  });
  
  // Deductions Table
  const deductions = [
    ['PF Deduction', formatCurrency(payslip.pf_deduction || 0)],
    ['Tax Deduction', formatCurrency(payslip.tax_deduction || 0)],
    ['Other Deductions', formatCurrency(payslip.other_deductions || 0)],
  ];
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Deductions', 'Amount']],
    body: deductions,
    theme: 'striped',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 110 },
    tableWidth: 85,
  });
  
  // Summary Section
  const summaryY = 175;
  
  doc.setFillColor(245, 247, 250);
  doc.rect(15, summaryY, 180, 35, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.text('Gross Earnings:', 20, summaryY + 12);
  doc.text('Total Deductions:', 20, summaryY + 22);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(payslip.gross_earnings), 70, summaryY + 12);
  doc.text(formatCurrency(payslip.total_deductions), 70, summaryY + 22);
  
  // Net Pay Box
  doc.setFillColor(37, 99, 235);
  doc.rect(115, summaryY + 5, 75, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Net Pay', 130, summaryY + 15);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(payslip.net_pay), 130, summaryY + 25);
  
  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated document and does not require a signature.', 105, 280, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
  
  // Download the PDF
  const fileName = `Payslip_${payslip.employee_id}_${payslip.pay_period}.pdf`;
  doc.save(fileName);
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPayPeriod(period: string): string {
  try {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return period;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
