import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { FileText, FolderOpen, FileStack, Upload } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeeDocumentsReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: documents = [] } = useMyDocuments();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const personal = documents.filter(d => !d.is_company_document).length;
    const company = documents.filter(d => d.is_company_document).length;
    const recent = documents.filter(d => {
      const created = new Date(d.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created > thirtyDaysAgo;
    }).length;

    return { total, personal, company, recent };
  }, [documents]);

  // Documents by type
  const docsByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    documents.forEach(doc => {
      typeMap.set(doc.type, (typeMap.get(doc.type) || 0) + 1);
    });
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return Array.from(typeMap.entries()).map(([name, value], i) => ({ 
      name, 
      value, 
      fill: colors[i % colors.length] 
    }));
  }, [documents]);

  // Documents by category
  const docsByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    documents.forEach(doc => {
      const category = doc.document_category || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [documents]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const exportData = {
    headers: ["Name", "Type", "Category", "Size", "Uploaded On"],
    rows: documents.map(d => [
      d.name,
      d.type,
      d.document_category || "-",
      formatFileSize(d.file_size),
      format(new Date(d.created_at), "dd MMM yyyy"),
    ]),
    filename: "my-documents-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Documents Report"
        description="Overview of your uploaded documents"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Documents Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Documents"
          value={stats.total.toString()}
          icon={FileText}
        />
        <StatCard
          title="Personal Documents"
          value={stats.personal.toString()}
          icon={FolderOpen}
        />
        <StatCard
          title="Company Policies"
          value={stats.company.toString()}
          icon={FileStack}
        />
        <StatCard
          title="Recent Uploads"
          value={stats.recent.toString()}
          icon={Upload}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Documents by Type"
          data={docsByType}
          showLegend
        />
        <BarChartCard
          title="Documents by Category"
          data={docsByCategory}
        />
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Uploaded On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.slice(0, 15).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="uppercase text-xs">{doc.type}</TableCell>
                    <TableCell>{doc.document_category || "-"}</TableCell>
                    <TableCell className="text-right">{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{format(new Date(doc.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
