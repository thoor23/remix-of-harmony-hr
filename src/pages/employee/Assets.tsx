import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Laptop, Monitor, Smartphone, Printer, HardDrive, Search, ArrowUpDown } from "lucide-react";
import { useMyAssets } from "@/hooks/useMyAssets";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const categoryIcons: Record<string, React.ElementType> = {
  laptop: Laptop,
  computer: Monitor,
  phone: Smartphone,
  printer: Printer,
  storage: HardDrive,
  default: Package,
};

const conditionColors: Record<string, string> = {
  excellent: "bg-success/10 text-success border-success/20",
  good: "bg-info/10 text-info border-info/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-destructive/10 text-destructive border-destructive/20",
};

type SortField = "name" | "category" | "serial_number" | "assigned_date" | "condition";
type SortDirection = "asc" | "desc";

export default function EmployeeAssets() {
  const { data: assets = [], isLoading: assetsLoading, isFetching } = useMyAssets();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const queryClient = useQueryClient();

  const isLoading = assetsLoading || employeeLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("assigned_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Column definitions
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "email", header: "Email", visible: true },
    { id: "department", header: "Department", visible: true },
    { id: "store", header: "Store/Location", visible: true },
    { id: "name", header: "Asset Name", visible: true },
    { id: "category", header: "Category", visible: true },
    { id: "asset_tag", header: "Asset Tag", visible: true },
    { id: "serial_number", header: "Serial Number", visible: true },
    { id: "condition", header: "Condition", visible: true },
    { id: "assigned_date", header: "Assigned Date", visible: true },
  ]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let data = [...assets];
    if (searchQuery) {
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return data.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "category":
          aVal = a.category?.name || "";
          bVal = b.category?.name || "";
          break;
        case "serial_number":
          aVal = a.serial_number || "";
          bVal = b.serial_number || "";
          break;
        case "assigned_date":
          aVal = a.assigned_date || "";
          bVal = b.assigned_date || "";
          break;
        case "condition":
          aVal = a.condition || "";
          bVal = b.condition || "";
          break;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [assets, searchQuery, sortField, sortDirection]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: filteredAssets, defaultPageSize: 10 });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 flex items-center gap-1 -ml-3 font-medium hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData.map((a) => a.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  };

  const handleExport = () => {
    const dataToExport = selectedRows.length > 0
      ? filteredAssets.filter((a) => selectedRows.includes(a.id))
      : filteredAssets;

    const exportData = dataToExport.map((a) => ({
      name: a.name,
      category: a.category?.name || "",
      asset_tag: a.asset_tag,
      serial_number: a.serial_number || "",
      brand: a.brand || "",
      model: a.model || "",
      condition: a.condition || "",
      assigned_date: a.assigned_date || "",
      department: currentEmployee?.department?.name || "-",
      store: currentEmployee?.primary_store?.name || "-",
    }));

    const exportColumns: ColumnDef[] = [
      { id: "name", header: "Asset Name", visible: true },
      { id: "category", header: "Category", visible: true },
      { id: "department", header: "Department", visible: true },
      { id: "store", header: "Store/Location", visible: true },
      { id: "asset_tag", header: "Asset Tag", visible: true },
      { id: "serial_number", header: "Serial Number", visible: true },
      { id: "brand", header: "Brand", visible: true },
      { id: "model", header: "Model", visible: true },
      { id: "condition", header: "Condition", visible: true },
      { id: "assigned_date", header: "Assigned Date", visible: true },
    ];

    exportToCSV(exportData, exportColumns, `my-assets-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success(`Exported ${dataToExport.length} assets`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-assets"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Assets" description="View assets assigned to you" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Skeleton className="h-24" />
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="My Assets" description="View assets assigned to you" />

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{assets.length}</p>
              <p className="text-sm text-muted-foreground">Assigned Assets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={isFetching}
        />

        {showFilters && (
          <div className="px-4 py-3 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, tag, or serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {columns.find((c) => c.id === "employee")?.visible && (
                <TableHead>Employee</TableHead>
              )}
              {columns.find((c) => c.id === "email")?.visible && (
                <TableHead>Email</TableHead>
              )}
              {columns.find((c) => c.id === "department")?.visible && (
                <TableHead>Department</TableHead>
              )}
              {columns.find((c) => c.id === "store")?.visible && (
                <TableHead>Store/Location</TableHead>
              )}
              {columns.find((c) => c.id === "name")?.visible && (
                <TableHead><SortableHeader field="name">Asset Name</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "category")?.visible && (
                <TableHead><SortableHeader field="category">Category</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "asset_tag")?.visible && (
                <TableHead>Asset Tag</TableHead>
              )}
              {columns.find((c) => c.id === "serial_number")?.visible && (
                <TableHead><SortableHeader field="serial_number">Serial Number</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "condition")?.visible && (
                <TableHead><SortableHeader field="condition">Condition</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "assigned_date")?.visible && (
                <TableHead><SortableHeader field="assigned_date">Assigned Date</SortableHeader></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((asset) => {
              const categoryName = asset.category?.name?.toLowerCase() || "default";
              const IconComponent = categoryIcons[categoryName] || categoryIcons.default;
              const conditionClass = conditionColors[asset.condition?.toLowerCase() || ""] || "";

              return (
                <TableRow key={asset.id} data-state={selectedRows.includes(asset.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(asset.id)}
                      onCheckedChange={(checked) => handleSelectRow(asset.id, checked as boolean)}
                    />
                  </TableCell>
                  {columns.find((c) => c.id === "employee")?.visible && (
                    <TableCell>
                      <EmployeeCell
                        avatarUrl={currentEmployee?.avatar_url}
                        firstName={currentEmployee?.first_name}
                        lastName={currentEmployee?.last_name}
                        employeeId={currentEmployee?.employee_id}
                      />
                    </TableCell>
                  )}
                  {columns.find((c) => c.id === "email")?.visible && (
                    <TableCell className="text-muted-foreground">{currentEmployee?.email || "-"}</TableCell>
                  )}
                  {columns.find((c) => c.id === "department")?.visible && (
                    <TableCell>{currentEmployee?.department?.name || "-"}</TableCell>
                  )}
                  {columns.find((c) => c.id === "store")?.visible && (
                    <TableCell>{currentEmployee?.primary_store?.name || "-"}</TableCell>
                  )}
                  {columns.find((c) => c.id === "name")?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          {(asset.brand || asset.model) && (
                            <p className="text-xs text-muted-foreground">
                              {[asset.brand, asset.model].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {columns.find((c) => c.id === "category")?.visible && (
                    <TableCell>
                      {asset.category?.name ? (
                        <Badge variant="secondary">{asset.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {columns.find((c) => c.id === "asset_tag")?.visible && (
                    <TableCell className="font-mono text-sm">{asset.asset_tag}</TableCell>
                  )}
                  {columns.find((c) => c.id === "serial_number")?.visible && (
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {asset.serial_number || "-"}
                    </TableCell>
                  )}
                  {columns.find((c) => c.id === "condition")?.visible && (
                    <TableCell>
                      {asset.condition ? (
                        <Badge variant="outline" className={conditionClass}>
                          {asset.condition}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {columns.find((c) => c.id === "assigned_date")?.visible && (
                    <TableCell className="text-muted-foreground">
                      {asset.assigned_date ? format(new Date(asset.assigned_date), "MMM dd, yyyy") : "-"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  {assets.length === 0 ? "No assets assigned to you" : "No assets found matching your search"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAssets.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
