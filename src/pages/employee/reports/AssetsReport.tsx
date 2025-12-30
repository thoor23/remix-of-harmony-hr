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
import { Package, CheckCircle, Layers } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyAssets } from "@/hooks/useMyAssets";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeeAssetsReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: assets = [] } = useMyAssets();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = assets.length;
    const active = assets.filter(a => a.status === "assigned").length;
    const categories = new Set(assets.map(a => a.category?.name)).size;

    return { total, active, categories };
  }, [assets]);

  // Assets by category
  const assetsByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    assets.forEach(asset => {
      const category = asset.category?.name || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return Array.from(categoryMap.entries()).map(([name, value], i) => ({ 
      name, 
      value, 
      fill: colors[i % colors.length] 
    }));
  }, [assets]);

  // Assets by condition
  const assetsByCondition = useMemo(() => {
    const conditionMap = new Map<string, number>();
    assets.forEach(asset => {
      const condition = asset.condition || "Unknown";
      conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
    });
    return Array.from(conditionMap.entries()).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const exportData = {
    headers: ["Asset Name", "Asset Tag", "Category", "Condition", "Assigned Date"],
    rows: assets.map(a => [
      a.name,
      a.asset_tag,
      a.category?.name || "-",
      a.condition || "-",
      a.assigned_date ? format(new Date(a.assigned_date), "dd MMM yyyy") : "-",
    ]),
    filename: "my-assets-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Assets Report"
        description="Overview of assets assigned to you"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Assets Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Assets"
          value={stats.total.toString()}
          icon={Package}
        />
        <StatCard
          title="Active Assets"
          value={stats.active.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="Categories"
          value={stats.categories.toString()}
          icon={Layers}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Assets by Category"
          data={assetsByCategory}
          showLegend
        />
        <BarChartCard
          title="Assets by Condition"
          data={assetsByCondition}
        />
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Assigned Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No assets assigned
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.asset_tag}</TableCell>
                    <TableCell>{asset.category?.name || "-"}</TableCell>
                    <TableCell className="capitalize">{asset.condition || "-"}</TableCell>
                    <TableCell>
                      {asset.assigned_date ? format(new Date(asset.assigned_date), "dd MMM yyyy") : "-"}
                    </TableCell>
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
