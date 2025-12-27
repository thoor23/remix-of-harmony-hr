import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PayslipData {
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  payPeriod: string;
  payDate: string;
  basicSalary: number;
  hra?: number;
  transportAllowance?: number;
  medicalAllowance?: number;
  otherAllowances?: number;
  grossEarnings: number;
  pfDeduction?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netPay: number;
  companyName?: string;
  companyAddress?: string;
}

interface PayslipTemplateData extends PayslipData {
  templateContent: string;
  footerText?: string;
}

export function generatePayslipPDF(data: PayslipData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.companyName || "Company Name", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyAddress || "Company Address", pageWidth / 2, 27, { align: "center" });
  
  // Payslip Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", pageWidth / 2, 40, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Pay Period: ${data.payPeriod}`, pageWidth / 2, 47, { align: "center" });
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(15, 52, pageWidth - 15, 52);
  
  // Employee Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 15, 62);
  
  doc.setFont("helvetica", "normal");
  const employeeDetails = [
    ["Employee Name:", data.employeeName],
    ["Employee ID:", data.employeeId],
    ["Department:", data.department],
    ["Designation:", data.designation],
    ["Pay Date:", format(new Date(data.payDate), "dd MMM yyyy")],
  ];
  
  let yPos = 70;
  employeeDetails.forEach(([label, value]) => {
    doc.text(label, 15, yPos);
    doc.text(value, 60, yPos);
    yPos += 6;
  });
  
  // Earnings Table
  const earningsData = [
    ["Basic Salary", formatCurrency(data.basicSalary)],
    ["HRA", formatCurrency(data.hra || 0)],
    ["Transport Allowance", formatCurrency(data.transportAllowance || 0)],
    ["Medical Allowance", formatCurrency(data.medicalAllowance || 0)],
    ["Other Allowances", formatCurrency(data.otherAllowances || 0)],
  ].filter(([_, value]) => value !== "₹0.00");
  
  earningsData.push(["Gross Earnings", formatCurrency(data.grossEarnings)]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [["Earnings", "Amount"]],
    body: earningsData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: 15, right: pageWidth / 2 + 5 },
  });
  
  // Deductions Table
  const deductionsData = [
    ["PF Deduction", formatCurrency(data.pfDeduction || 0)],
    ["Tax Deduction", formatCurrency(data.taxDeduction || 0)],
    ["Other Deductions", formatCurrency(data.otherDeductions || 0)],
  ].filter(([_, value]) => value !== "₹0.00");
  
  deductionsData.push(["Total Deductions", formatCurrency(data.totalDeductions)]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: pageWidth / 2 + 5, right: 15 },
  });
  
  // Net Pay Section
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFillColor(34, 197, 94);
  doc.rect(15, finalY, pageWidth - 30, 15, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", 20, finalY + 10);
  doc.text(formatCurrency(data.netPay), pageWidth - 20, finalY + 10, { align: "right" });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated document and does not require a signature.",
    pageWidth / 2,
    finalY + 30,
    { align: "center" }
  );
  
  doc.text(
    `Generated on: ${format(new Date(), "dd MMM yyyy 'at' hh:mm a")}`,
    pageWidth / 2,
    finalY + 36,
    { align: "center" }
  );
  
  return doc;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function downloadPayslipPDF(data: PayslipData, filename?: string) {
  const doc = generatePayslipPDF(data);
  const defaultFilename = `payslip-${data.employeeId}-${data.payPeriod.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(filename || defaultFilename);
}

// Template-based payslip generation
export function generatePayslipFromTemplate(data: PayslipTemplateData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Replace placeholders in template
  const replacements: Record<string, string> = {
    "{{employee_name}}": data.employeeName,
    "{{employee_id}}": data.employeeId,
    "{{department}}": data.department,
    "{{designation}}": data.designation,
    "{{pay_period}}": data.payPeriod,
    "{{pay_date}}": format(new Date(data.payDate), "dd MMM yyyy"),
    "{{basic_salary}}": formatCurrency(data.basicSalary),
    "{{hra}}": formatCurrency(data.hra || 0),
    "{{transport_allowance}}": formatCurrency(data.transportAllowance || 0),
    "{{medical_allowance}}": formatCurrency(data.medicalAllowance || 0),
    "{{other_allowances}}": formatCurrency(data.otherAllowances || 0),
    "{{gross_earnings}}": formatCurrency(data.grossEarnings),
    "{{pf_deduction}}": formatCurrency(data.pfDeduction || 0),
    "{{tax_deduction}}": formatCurrency(data.taxDeduction || 0),
    "{{other_deductions}}": formatCurrency(data.otherDeductions || 0),
    "{{total_deductions}}": formatCurrency(data.totalDeductions),
    "{{net_pay}}": formatCurrency(data.netPay),
    "{{company_name}}": data.companyName || "Company Name",
    "{{company_address}}": data.companyAddress || "Company Address",
    "{{footer_text}}": data.footerText || "This is a computer-generated document.",
    "{{current_date}}": format(new Date(), "dd MMM yyyy 'at' hh:mm a"),
  };
  
  let content = data.templateContent;
  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });
  
  // For HTML templates, we'll render using a simple text-based approach
  // In production, you might want to use html2canvas or similar
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.companyName || "Company Name", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyAddress || "Company Address", pageWidth / 2, 27, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", pageWidth / 2, 40, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Pay Period: ${data.payPeriod}`, pageWidth / 2, 47, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(15, 52, pageWidth - 15, 52);
  
  // Employee Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 15, 62);
  
  doc.setFont("helvetica", "normal");
  const employeeDetails = [
    ["Employee Name:", data.employeeName],
    ["Employee ID:", data.employeeId],
    ["Department:", data.department],
    ["Designation:", data.designation],
    ["Pay Date:", format(new Date(data.payDate), "dd MMM yyyy")],
  ];
  
  let yPos = 70;
  employeeDetails.forEach(([label, value]) => {
    doc.text(label, 15, yPos);
    doc.text(value, 60, yPos);
    yPos += 6;
  });
  
  // Earnings Table
  const earningsData = [
    ["Basic Salary", formatCurrency(data.basicSalary)],
    ["HRA", formatCurrency(data.hra || 0)],
    ["Transport Allowance", formatCurrency(data.transportAllowance || 0)],
    ["Medical Allowance", formatCurrency(data.medicalAllowance || 0)],
    ["Other Allowances", formatCurrency(data.otherAllowances || 0)],
  ].filter(([_, value]) => value !== "₹0.00");
  
  earningsData.push(["Gross Earnings", formatCurrency(data.grossEarnings)]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [["Earnings", "Amount"]],
    body: earningsData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: 15, right: pageWidth / 2 + 5 },
  });
  
  // Deductions Table
  const deductionsData = [
    ["PF Deduction", formatCurrency(data.pfDeduction || 0)],
    ["Tax Deduction", formatCurrency(data.taxDeduction || 0)],
    ["Other Deductions", formatCurrency(data.otherDeductions || 0)],
  ].filter(([_, value]) => value !== "₹0.00");
  
  deductionsData.push(["Total Deductions", formatCurrency(data.totalDeductions)]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: pageWidth / 2 + 5, right: 15 },
  });
  
  // Net Pay Section
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFillColor(34, 197, 94);
  doc.rect(15, finalY, pageWidth - 30, 15, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", 20, finalY + 10);
  doc.text(formatCurrency(data.netPay), pageWidth - 20, finalY + 10, { align: "right" });
  
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    data.footerText || "This is a computer-generated document and does not require a signature.",
    pageWidth / 2,
    finalY + 30,
    { align: "center" }
  );
  
  doc.text(
    `Generated on: ${format(new Date(), "dd MMM yyyy 'at' hh:mm a")}`,
    pageWidth / 2,
    finalY + 36,
    { align: "center" }
  );
  
  return doc;
}

export function downloadPayslipFromTemplate(data: PayslipTemplateData, filename?: string) {
  const doc = generatePayslipFromTemplate(data);
  const defaultFilename = `payslip-${data.employeeId}-${data.payPeriod.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(filename || defaultFilename);
}
