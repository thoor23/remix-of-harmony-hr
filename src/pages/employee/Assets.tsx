import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Laptop, Monitor, Smartphone, Printer, HardDrive, Search, ArrowUpDown, X, Wrench, AlertCircle } from "lucide-react";
import { useMyAssets } from "@/hooks/useMyAssets";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyMaintenanceRequests, useCreateMaintenanceRequest, useCancelMaintenanceRequest } from "@/hooks/useMaintenanceRequests";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MaintenanceRequestPriority, MaintenanceRequestType, MaintenanceRequestStatus } from "@/types/asset";

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

const requestStatusColors: Record<MaintenanceRequestStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-info/10 text-info border-info/20",
  on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<MaintenanceRequestPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/10 text-info border-info/20",
  high: "bg-warning/10 text-warning border-warning/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

type SortField = "name" | "category" | "serial_number" | "assigned_date" | "condition";
type SortDirection = "asc" | "desc";

export default function EmployeeAssets() {
  const { data: assets = [], isLoading: assetsLoading, isFetching } = useMyAssets();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: maintenanceRequests = [], isLoading: requestsLoading } = useMyMaintenanceRequests();
  const createRequest = useCreateMaintenanceRequest();
  const cancelRequest = useCancelMaintenanceRequest();
  const queryClient = useQueryClient();

  const isLoading = assetsLoading || employeeLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("assigned_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(true);

  // Maintenance request dialog
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({
    asset_id: "",
    type: "repair" as MaintenanceRequestType,
    priority: "medium" as MaintenanceRequestPriority,
    description: "",
  });

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

  // Get unique categories from assets
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    assets.forEach((a) => {
      if (a.category?.name) categories.add(a.category.name);
    });
    return Array.from(categories);
  }, [assets]);

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || conditionFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setConditionFilter("all");
  };

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

    if (categoryFilter !== "all") {
      data = data.filter((a) => a.category?.name === categoryFilter);
    }

    if (conditionFilter !== "all") {
      data = data.filter((a) => a.condition?.toLowerCase() === conditionFilter);
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
  }, [assets, searchQuery, categoryFilter, conditionFilter, sortField, sortDirection]);

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
    queryClient.invalidateQueries({ queryKey: ["my-maintenance-requests"] });
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.asset_id || !requestForm.description) {
      toast.error("Please select an asset and provide a description");
      return;
    }

    await createRequest.mutateAsync({
      asset_id: requestForm.asset_id,
      type: requestForm.type,
      priority: requestForm.priority,
      description: requestForm.description,
    });

    setShowRequestDialog(false);
    setRequestForm({
      asset_id: "",
      type: "repair",
      priority: "medium",
      description: "",
    });
  };

  const handleCancelRequest = async (id: string) => {
    await cancelRequest.mutateAsync(id);
  };

  const formatStatusLabel = (status: MaintenanceRequestStatus) => {
    const labels: Record<MaintenanceRequestStatus, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      scheduled: "Scheduled",
      in_progress: "In Progress",
      on_hold: "On Hold",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
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
      <PageHeader title="My Assets" description="View assets assigned to you">
        <Button onClick={() => setShowRequestDialog(true)} disabled={assets.length === 0}>
          <Wrench className="mr-2 h-4 w-4" />
          Request Maintenance
        </Button>
      </PageHeader>

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
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {maintenanceRequests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card className="mb-6">
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
          <div className="p-4 border-b bg-muted/30 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, tag, or serial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1.5">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
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
                  {assets.length === 0 ? "No assets assigned to you" : "No assets found matching your filters"}
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

      {/* My Maintenance Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            My Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>No maintenance requests yet</p>
              <p className="text-sm">Submit a request when you need asset maintenance</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.asset?.name || "-"}
                      {request.asset?.asset_tag && (
                        <span className="block text-xs text-muted-foreground font-mono">
                          {request.asset.asset_tag}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {request.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[request.priority]}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={requestStatusColors[request.status]}>
                        {formatStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelRequest.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      )}
                      {request.review_comments && (
                        <span className="text-xs text-muted-foreground">
                          {request.review_comments}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Maintenance Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Maintenance</DialogTitle>
            <DialogDescription>
              Submit a maintenance request for one of your assigned assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset *</Label>
              <Select
                value={requestForm.asset_id}
                onValueChange={(value) => setRequestForm({ ...requestForm, asset_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={requestForm.type}
                  onValueChange={(value) => setRequestForm({ ...requestForm, type: value as MaintenanceRequestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select
                  value={requestForm.priority}
                  onValueChange={(value) => setRequestForm({ ...requestForm, priority: value as MaintenanceRequestPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the issue or maintenance needed (e.g., 'Windows not booting, showing blue screen error')"
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!requestForm.asset_id || !requestForm.description || createRequest.isPending}
            >
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
