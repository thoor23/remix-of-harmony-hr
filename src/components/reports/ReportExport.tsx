import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Printer, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
}

interface ReportExportProps {
  data: ExportData;
  title?: string;
}

export function ReportExport({ data, title = "Report" }: ReportExportProps) {
  const getFilename = () => {
    return `${data.filename || title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;
  };

  const exportToCSV = () => {
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${getFilename()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Your CSV file has been downloaded.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add table
    autoTable(doc, {
      head: [data.headers],
      body: data.rows.map(row => row.map(cell => String(cell))),
      startY: 38,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [22, 163, 74], // Primary green color
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    doc.save(`${getFilename()}.pdf`);
    
    toast({
      title: "Export successful",
      description: "Your PDF file has been downloaded.",
    });
  };

  const handlePrint = () => {
    // Create a printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .date { color: #666; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #16a34a; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>${data.headers.map(h => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data.rows.map(row => 
                `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
    
    toast({
      title: "Print dialog opened",
      description: "Select your printer to continue.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
