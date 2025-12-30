import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreHorizontal, Eye, Wrench, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock, Pause, PlayCircle } from "lucide-react";
import { useAssetMaintenance, useCreateMaintenance, useAssets } from "@/hooks/useAssets";
import { useAllMaintenanceRequests, useUpdateMaintenanceRequest } from "@/hooks/useMaintenanceRequests";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { MaintenanceRequestStatus } from "@/types/asset";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const typeColors: Record<string, string> = {
  repair: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  service: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  upgrade: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  replacement: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
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

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/10 text-info border-info/20",
  high: "bg-warning/10 text-warning border-warning/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "asset", header: "Asset", accessor: (row: any) => row.asset?.name || "-", visible: true },
  { id: "type", header: "Type", accessor: "type", visible: true },
  { id: "description", header: "Description", accessor: "description", visible: true },
  { id: "vendor", header: "Vendor", accessor: "vendor", visible: true },
  { id: "scheduled_date", header: "Scheduled", accessor: "scheduled_date", visible: true },
  { id: "completed_date", header: "Completed", accessor: "completed_date", visible: true },
  { id: "cost", header: "Cost", accessor: "cost", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function AssetMaintenance() {
  const navigate = useNavigate();
  const { data: maintenanceRecords = [], isLoading, refetch } = useAssetMaintenance();
  const { data: assets = [] } = useAssets();
  const createMaintenance = useCreateMaintenance();
  
  // Employee requests
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const { data: employeeRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useAllMaintenanceRequests({ status: requestStatusFilter !== "all" ? requestStatusFilter : undefined });
  const updateRequest = useUpdateMaintenanceRequest();

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ asset_id: "", type: "service", description: "", cost: "", vendor: "", scheduled_date: "", notes: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  // Action dialog states
  const [actionDialog, setActionDialog] = useState<{ type: 'approve' | 'reject' | 'complete' | null; requestId: string | null }>({ type: null, requestId: null });
  const [actionForm, setActionForm] = useState({ review_comments: "", scheduled_date: "", resolution_notes: "" });

  const pendingRequestsCount = useMemo(() => 
    employeeRequests.filter(r => r.status === 'pending').length, 
    [employeeRequests]
  );

  const filteredRecords = useMemo(() => {
    let filtered = maintenanceRecords;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.asset?.name?.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query) || r.vendor?.toLowerCase().includes(query));
    }
    if (typeFilter !== "all") filtered = filtered.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
    return filtered;
  }, [maintenanceRecords, searchQuery, typeFilter, statusFilter]);

  const sortedRecords = useMemo(() => {
    if (!sortColumn) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      let aVal: any = sortColumn === "asset" ? a.asset?.name || "" : (a as any)[sortColumn] ?? "";
      let bVal: any = sortColumn === "asset" ? b.asset?.name || "" : (b as any)[sortColumn] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortColumn, sortDirection]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: sortedRecords, defaultPageSize: 10 });

  // Pagination for requests
  const requestPagination = usePagination({ data: employeeRequests, defaultPageSize: 10 });

  const resetForm = () => setFormData({ asset_id: "", type: "service", description: "", cost: "", vendor: "", scheduled_date: "", notes: "" });

  const handleSubmit = async () => {
    await createMaintenance.mutateAsync({
      asset_id: formData.asset_id,
      type: formData.type,
      description: formData.description || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      vendor: formData.vendor || undefined,
      scheduled_date: formData.scheduled_date || undefined,
      notes: formData.notes || undefined,
    });
    setShowDialog(false);
    resetForm();
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  const handleExport = () => exportToCSV(sortedRecords, columns, "asset-maintenance-export");
  const handleSelectAll = (checked: boolean) => setSelectedRows(checked ? new Set(paginatedData.map((r) => r.id)) : new Set());
  const handleSelectRow = (id: string, checked: boolean) => { const s = new Set(selectedRows); checked ? s.add(id) : s.delete(id); setSelectedRows(s); };
  const handleSort = (columnId: string) => { if (sortColumn === columnId) setSortDirection((p) => (p === "asc" ? "desc" : "asc")); else { setSortColumn(columnId); setSortDirection("asc"); } };

  const renderCellValue = (record: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(record) : record[column.accessor];
    switch (column.id) {
      case "type": return <Badge className={typeColors[value] || ""}>{value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      case "status": return <Badge className={statusColors[value] || ""}>{value === "in_progress" ? "In Progress" : value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      case "scheduled_date": case "completed_date": return value ? format(new Date(value), "dd MMM yyyy") : "-";
      case "cost": return `₹${(value || 0).toLocaleString()}`;
      case "description": return value ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : "-";
      default: return value || "-";
    }
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

  const handleStatusChange = async (requestId: string, newStatus: MaintenanceRequestStatus, additionalData?: Record<string, unknown>) => {
    await updateRequest.mutateAsync({
      id: requestId,
      status: newStatus,
      ...additionalData,
    });
    refetchRequests();
  };

  const handleActionSubmit = async () => {
    if (!actionDialog.requestId || !actionDialog.type) return;

    const data: Record<string, unknown> = {};

    if (actionDialog.type === 'approve') {
      data.status = 'approved';
      if (actionForm.scheduled_date) data.scheduled_date = actionForm.scheduled_date;
      if (actionForm.review_comments) data.review_comments = actionForm.review_comments;
    } else if (actionDialog.type === 'reject') {
      data.status = 'rejected';
      data.review_comments = actionForm.review_comments;
    } else if (actionDialog.type === 'complete') {
      data.status = 'completed';
      if (actionForm.resolution_notes) data.resolution_notes = actionForm.resolution_notes;
    }

    await updateRequest.mutateAsync({
      id: actionDialog.requestId,
      ...data,
    });

    setActionDialog({ type: null, requestId: null });
    setActionForm({ review_comments: "", scheduled_date: "", resolution_notes: "" });
    refetchRequests();
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedRows.has(r.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Maintenance" description="Schedule and track asset maintenance">
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" />Schedule Maintenance</Button>
      </PageHeader>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Maintenance</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Employee Requests
            {pendingRequestsCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-warning text-warning-foreground">
                {pendingRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Maintenance Tab */}
        <TabsContent value="scheduled">
          <Card>
            <DataTableToolbar columns={columns} onToggleColumn={handleToggleColumn} onExport={handleExport} onRefresh={() => refetch()} onAddRow={() => setShowDialog(true)} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} addRowLabel="Schedule Maintenance" />

            {showFilter && (
              <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search maintenance..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="repair">Repair</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"><Checkbox checked={allSelected} onCheckedChange={handleSelectAll} /></TableHead>
                    {visibleColumns.map((column) => (
                      <TableHead key={column.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column.id)}>
                        <div className="flex items-center gap-1">{column.header}{sortColumn === column.id && (sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}</div>
                      </TableHead>
                    ))}
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell>{visibleColumns.map((col) => (<TableCell key={col.id}><Skeleton className="h-4 w-24" /></TableCell>))}<TableCell><Skeleton className="h-4 w-8" /></TableCell></TableRow>))
                  : paginatedData.length === 0 ? (<TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground"><Wrench className="h-10 w-10 mb-2" /><p>No maintenance records found</p></div></TableCell></TableRow>)
                  : paginatedData.map((record) => (
                    <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/assets/${record.asset_id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows.has(record.id)} onCheckedChange={(checked) => handleSelectRow(record.id, !!checked)} /></TableCell>
                      {visibleColumns.map((column) => (<TableCell key={column.id}>{renderCellValue(record, column)}</TableCell>))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/admin/assets/${record.asset_id}`)}><Eye className="h-4 w-4 mr-2" />View Asset</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedRecords.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </Card>
        </TabsContent>

        {/* Employee Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <div className="flex flex-wrap items-center gap-3 p-4 border-b">
              <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetchRequests()}>
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : requestPagination.paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Wrench className="h-10 w-10 mb-2" />
                          <p>No maintenance requests found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requestPagination.paginatedData.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.employee?.first_name} {request.employee?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.employee?.employee_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.asset?.name || "-"}</p>
                            {request.asset?.asset_tag && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {request.asset.asset_tag}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[request.type] || ""}>
                            {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityColors[request.priority] || ""}>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {request.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => setActionDialog({ type: 'approve', requestId: request.id })}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setActionDialog({ type: 'reject', requestId: request.id })}>
                                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'scheduled')}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Mark Scheduled
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'in_progress')}>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Start Work
                                  </DropdownMenuItem>
                                </>
                              )}
                              {request.status === 'scheduled' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'in_progress')}>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Start Work
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'on_hold')}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Put On Hold
                                  </DropdownMenuItem>
                                </>
                              )}
                              {request.status === 'in_progress' && (
                                <>
                                  <DropdownMenuItem onClick={() => setActionDialog({ type: 'complete', requestId: request.id })}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'on_hold')}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Put On Hold
                                  </DropdownMenuItem>
                                </>
                              )}
                              {request.status === 'on_hold' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'in_progress')}>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Resume Work
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/admin/assets/${request.asset_id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Asset
                              </DropdownMenuItem>
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
              currentPage={requestPagination.currentPage}
              totalPages={requestPagination.totalPages}
              totalItems={employeeRequests.length}
              pageSize={requestPagination.pageSize}
              onPageChange={requestPagination.setCurrentPage}
              onPageSizeChange={requestPagination.setPageSize}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle><DialogDescription>Create a new maintenance record for an asset.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Asset *</Label><Select value={formData.asset_id} onValueChange={(value) => setFormData({ ...formData, asset_id: value })}><SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger><SelectContent>{assets.map((asset) => (<SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Type *</Label><Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="repair">Repair</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Maintenance description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Vendor</Label><Input placeholder="Service provider" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} /></div><div className="space-y-2"><Label>Estimated Cost (₹)</Label><Input type="number" placeholder="0" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>Scheduled Date</Label><DatePicker value={formData.scheduled_date} onChange={(value) => setFormData({ ...formData, scheduled_date: value })} placeholder="Select scheduled date" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={!formData.asset_id || createMaintenance.isPending}>{createMaintenance.isPending ? "Creating..." : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve/Reject/Complete) */}
      <Dialog open={actionDialog.type !== null} onOpenChange={(open) => !open && setActionDialog({ type: null, requestId: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' && 'Approve Request'}
              {actionDialog.type === 'reject' && 'Reject Request'}
              {actionDialog.type === 'complete' && 'Complete Maintenance'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' && 'Approve this maintenance request. You can optionally set a scheduled date.'}
              {actionDialog.type === 'reject' && 'Reject this maintenance request. Please provide a reason.'}
              {actionDialog.type === 'complete' && 'Mark this maintenance as completed. Add resolution notes if needed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === 'approve' && (
              <>
                <div className="space-y-2">
                  <Label>Scheduled Date (Optional)</Label>
                  <DatePicker
                    value={actionForm.scheduled_date}
                    onChange={(value) => setActionForm({ ...actionForm, scheduled_date: value })}
                    placeholder="Select scheduled date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comments (Optional)</Label>
                  <Textarea
                    placeholder="Add any comments..."
                    value={actionForm.review_comments}
                    onChange={(e) => setActionForm({ ...actionForm, review_comments: e.target.value })}
                  />
                </div>
              </>
            )}
            {actionDialog.type === 'reject' && (
              <div className="space-y-2">
                <Label>Reason for Rejection *</Label>
                <Textarea
                  placeholder="Explain why this request is being rejected..."
                  value={actionForm.review_comments}
                  onChange={(e) => setActionForm({ ...actionForm, review_comments: e.target.value })}
                  rows={4}
                />
              </div>
            )}
            {actionDialog.type === 'complete' && (
              <div className="space-y-2">
                <Label>Resolution Notes (Optional)</Label>
                <Textarea
                  placeholder="Describe what was done to resolve the issue..."
                  value={actionForm.resolution_notes}
                  onChange={(e) => setActionForm({ ...actionForm, resolution_notes: e.target.value })}
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, requestId: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={updateRequest.isPending || (actionDialog.type === 'reject' && !actionForm.review_comments)}
              variant={actionDialog.type === 'reject' ? 'destructive' : 'default'}
            >
              {updateRequest.isPending ? "Processing..." : (
                actionDialog.type === 'approve' ? 'Approve' :
                actionDialog.type === 'reject' ? 'Reject' : 'Complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
