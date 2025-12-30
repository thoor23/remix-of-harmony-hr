import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Package,
  Laptop,
  Smartphone,
  Armchair,
  Car,
  Wrench,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  PackageOpen,
} from "lucide-react";
import { useAssets, useAssetCategories, useAssetStats } from "@/hooks/useAssets";
import { useAllLocations } from "@/hooks/useLocations";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { format } from "date-fns";
import { useHasPermission } from "@/components/auth/PermissionGate";

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  retired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const conditionColors: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop: Laptop,
  Smartphone: Smartphone,
  Armchair: Armchair,
  Car: Car,
  Wrench: Wrench,
  Package: Package,
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "asset_tag", header: "Asset Tag", accessor: "asset_tag", visible: true },
  { id: "name", header: "Name", accessor: "name", visible: true },
  { id: "category", header: "Category", accessor: (row: any) => row.category?.name || "-", visible: true },
  { id: "location", header: "Location", accessor: (row: any) => row.location?.name || "-", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "condition", header: "Condition", accessor: "condition", visible: true },
  { id: "assigned_to", header: "Assigned To", accessor: (row: any) => row.assignee ? `${row.assignee.first_name} ${row.assignee.last_name}` : "-", visible: true },
  { id: "purchase_date", header: "Purchase Date", accessor: "purchase_date", visible: true },
  { id: "purchase_cost", header: "Purchase Cost", accessor: "purchase_cost", visible: false },
];

export default function AssetList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  const { data: assets = [], isLoading, refetch } = useAssets();
  const { data: categories } = useAssetCategories();
  const { data: locations } = useAllLocations();
  const { data: stats } = useAssetStats();
  
  const canCreate = useHasPermission("Assets", "create");
  const canUpdate = useHasPermission("Assets", "update");
  const canDelete = useHasPermission("Assets", "delete");

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name?.toLowerCase().includes(query) ||
          asset.asset_tag?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((asset) => asset.category_id === categoryFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((asset) => asset.location_id === locationFilter);
    }

    return filtered;
  }, [assets, searchQuery, statusFilter, categoryFilter, locationFilter]);

  const sortedAssets = useMemo(() => {
    if (!sortColumn) return filteredAssets;

    return [...filteredAssets].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case "category":
          aVal = a.category?.name || "";
          bVal = b.category?.name || "";
          break;
        case "location":
          aVal = a.location?.name || "";
          bVal = b.location?.name || "";
          break;
        case "assigned_to":
          aVal = a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : "";
          bVal = b.assignee ? `${b.assignee.first_name} ${b.assignee.last_name}` : "";
          break;
        default:
          aVal = (a as any)[sortColumn] ?? "";
          bVal = (b as any)[sortColumn] ?? "";
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAssets, sortColumn, sortDirection]);

  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedAssets, defaultPageSize: 10 });

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible } : col))
    );
  };

  const handleExport = () => {
    exportToCSV(sortedAssets, columns, "assets-export");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((a) => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const getCategoryIcon = (iconName: string | null) => {
    const IconComponent = categoryIcons[iconName || "Package"] || Package;
    return <IconComponent className="h-4 w-4" />;
  };

  const renderCellValue = (asset: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(asset) : asset[column.accessor];

    switch (column.id) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            {getCategoryIcon(asset.category?.icon || null)}
            <span>{value}</span>
          </div>
        );
      case "status":
        return (
          <Badge className={statusColors[value] || "bg-gray-100 text-gray-800"}>
            {value?.charAt(0).toUpperCase() + value?.slice(1)}
          </Badge>
        );
      case "condition":
        return value ? (
          <Badge className={conditionColors[value] || "bg-gray-100 text-gray-800"}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        ) : "-";
      case "purchase_date":
        return value ? format(new Date(value), "dd MMM yyyy") : "-";
      case "purchase_cost":
        return value ? `₹${value.toLocaleString()}` : "-";
      default:
        return value || "-";
    }
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((a) => selectedRows.has(a.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Management" description="Manage and track your organization's assets" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-2xl font-bold">{stats?.totalAssets || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.byStatus?.available || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.byStatus?.assigned || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">₹{(stats?.totalValue || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          onAddRow={canCreate ? () => navigate("/admin/assets/add") : undefined}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          addRowLabel="Add Asset"
        />

        {showFilter && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {sortColumn === column.id &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <PackageOpen className="h-10 w-10 mb-2" />
                      <p>No assets found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/assets/${asset.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(asset.id)}
                        onCheckedChange={(checked) => handleSelectRow(asset.id, !!checked)}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id}>{renderCellValue(asset, column)}</TableCell>
                    ))}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/assets/${asset.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />View
                          </DropdownMenuItem>
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => navigate(`/admin/assets/${asset.id}/edit`)}>
                              <Pencil className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedAssets.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
