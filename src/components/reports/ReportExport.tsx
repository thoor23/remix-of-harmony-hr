import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Printer, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    link.setAttribute("download", `${data.filename || title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Your CSV file has been downloaded.",
    });
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print dialog opened",
      description: "Select your printer to continue.",
    });
  };

  const exportToJSON = () => {
    const jsonData = data.rows.map((row) => {
      const obj: Record<string, string | number> = {};
      data.headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.filename || title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Your JSON file has been downloaded.",
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
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
