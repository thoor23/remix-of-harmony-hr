import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowUpDown, 
  Plus,
  FileEdit
} from "lucide-react";
import { 
  useMyRegularizationRequests, 
  useCreateRegularizationRequest 
} from "@/hooks/useAttendanceRegularization";
import { format } from "date-fns";
import { toast } from "sonner";

const defaultColumns: ColumnDef[] = [
  { id: "request_date", header: "Request Date", accessor: "request_date", visible: true },
  { id: "request_type", header: "Type", accessor: "request_type", visible: true },
  { id: "original_time", header: "Original Time", accessor: "original_time", visible: true },
  { id: "requested_time", header: "Requested Time", accessor: "requested_time", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "created_at", header: "Submitted On", accessor: "created_at", visible: true },
];

const requestTypes = [
  { value: "time_correction", label: "Time Correction" },
  { value: "missing_entry", label: "Missing Entry" },
  { value: "overtime_claim", label: "Overtime Claim" },
];

export default function EmployeeAttendanceRegularization() {
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [requestType, setRequestType] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [originalCheckIn, setOriginalCheckIn] = useState("");
  const [originalCheckOut, setOriginalCheckOut] = useState("");
  const [requestedCheckIn, setRequestedCheckIn] = useState("");
  const [requestedCheckOut, setRequestedCheckOut] = useState("");
  const [reason, setReason] = useState("");

  const { data: requests = [], isLoading, refetch } = useMyRegularizationRequests();
  const createRequest = useCreateRegularizationRequest();

  // Filter by status
  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  // Sort records
  const sortedRequests = useMemo(() => {
    if (!sortConfig) return filteredRequests;
    return [...filteredRequests].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRequests, defaultPageSize: 10 });

  // Calculate stats
  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible } : col))
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? sortedRequests.filter((r) => selectedRows.has(r.id))
      : sortedRequests;
    
    const exportData = dataToExport.map((r) => ({
      request_date: r.request_date,
      request_type: r.request_type,
      original_check_in: r.original_check_in || "-",
      original_check_out: r.original_check_out || "-",
      requested_check_in: r.requested_check_in || "-",
      requested_check_out: r.requested_check_out || "-",
      reason: r.reason,
      status: r.status,
      created_at: format(new Date(r.created_at), "dd MMM yyyy"),
    }));
    exportToCSV(exportData, columns, "regularization-requests");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const resetForm = () => {
    setRequestType("");
    setRequestDate("");
    setOriginalCheckIn("");
    setOriginalCheckOut("");
    setRequestedCheckIn("");
    setRequestedCheckOut("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestType || !requestDate || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createRequest.mutateAsync({
        request_type: requestType,
        request_date: requestDate,
        requested_check_in: requestedCheckIn || undefined,
        requested_check_out: requestedCheckOut || undefined,
        reason,
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return time.slice(0, 5);
  };

  const getTypeLabel = (type: string) => {
    const found = requestTypes.find((t) => t.value === type);
    return found?.label || type;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Regularization" description="Request corrections to your attendance records" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader title="Attendance Regularization" description="Request corrections to your attendance records" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Regularization</DialogTitle>
              <DialogDescription>
                Submit a request to correct your attendance record
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request_type">Request Type *</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request_date">Date *</Label>
                <Input
                  id="request_date"
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original_check_in">Original Check-In</Label>
                  <Input
                    id="original_check_in"
                    type="time"
                    value={originalCheckIn}
                    onChange={(e) => setOriginalCheckIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_check_out">Original Check-Out</Label>
                  <Input
                    id="original_check_out"
                    type="time"
                    value={originalCheckOut}
                    onChange={(e) => setOriginalCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requested_check_in">Requested Check-In</Label>
                  <Input
                    id="requested_check_in"
                    type="time"
                    value={requestedCheckIn}
                    onChange={(e) => setRequestedCheckIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested_check_out">Requested Check-Out</Label>
                  <Input
                    id="requested_check_out"
                    type="time"
                    value={requestedCheckOut}
                    onChange={(e) => setRequestedCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need this correction..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequest.isPending}>
                  {createRequest.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((r) => selectedRows.has(r.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort(col.id)}
                  >
                    {col.header}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(request.id)}
                      onCheckedChange={(checked) => handleSelectRow(request.id, checked as boolean)}
                    />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      {col.id === "request_date" ? (
                        format(new Date(request.request_date), "dd MMM yyyy")
                      ) : col.id === "request_type" ? (
                        <span className="flex items-center gap-2">
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                          {getTypeLabel(request.request_type)}
                        </span>
                      ) : col.id === "original_time" ? (
                        <span className="text-muted-foreground">
                          {formatTime(request.original_check_in)} - {formatTime(request.original_check_out)}
                        </span>
                      ) : col.id === "requested_time" ? (
                        <span>
                          {formatTime(request.requested_check_in)} - {formatTime(request.requested_check_out)}
                        </span>
                      ) : col.id === "reason" ? (
                        <span className="max-w-xs truncate block" title={request.reason}>
                          {request.reason}
                        </span>
                      ) : col.id === "status" ? (
                        <StatusBadge status={request.status as any} />
                      ) : col.id === "created_at" ? (
                        format(new Date(request.created_at), "dd MMM yyyy")
                      ) : (
                        request[col.id as keyof typeof request] || "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p>No regularization requests found</p>
                    <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first request
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
