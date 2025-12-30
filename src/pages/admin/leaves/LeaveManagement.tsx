import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, CalendarCheck, Clock, CalendarX, Search, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLeaveRequests, useLeaveTypes, useUpdateLeaveRequest, LeaveRequestWithDetails } from "@/hooks/useLeaves";
import { format } from "date-fns";
import { toast } from "sonner";
import { EmployeeCell } from "@/components/shared/EmployeeCell";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: (row: LeaveRequestWithDetails) => {
    const emp = row.employee;
    if (!emp) return "Unknown";
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
  }, visible: true },
  { id: "leave_type", header: "Leave Type", accessor: (row: LeaveRequestWithDetails) => row.leave_type?.name || "Unknown", visible: true },
  { id: "start_date", header: "From", accessor: "start_date", visible: true },
  { id: "end_date", header: "To", accessor: "end_date", visible: true },
  { id: "days", header: "Days", accessor: "days", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "created_at", header: "Applied On", accessor: "created_at", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function LeaveManagement() {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: leaveRequests = [], isLoading, refetch, isFetching } = useLeaveRequests();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const updateLeaveRequest = useUpdateLeaveRequest();

  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved");
  const rejectedRequests = leaveRequests.filter((r) => r.status === "rejected");

  const getEmployeeName = (request: LeaveRequestWithDetails) => {
    const emp = request.employee;
    if (!emp) return "Unknown";
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
  };

  const getEmployeeInitials = (request: LeaveRequestWithDetails) => {
    const emp = request.employee;
    if (!emp) return "??";
    return `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase() || "??";
  };

  const filteredRequests = useMemo(() => 
    leaveRequests.filter((r) => {
      const name = getEmployeeName(r).toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [leaveRequests, search, statusFilter]);

  const getColumnValue = (request: LeaveRequestWithDetails, column: ColumnDef): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(request);
    }
    return (request as any)[column.accessor];
  };

  const sortedRequests = useMemo(() => {
    if (!sortColumn) return filteredRequests;
    
    return [...filteredRequests].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });
  }, [filteredRequests, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRequests, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleAction = (request: LeaveRequestWithDetails, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setComments("");
  };

  const confirmAction = () => {
    if (selectedRequest && actionType) {
      updateLeaveRequest.mutate({
        id: selectedRequest.id,
        status: actionType === "approve" ? "approved" : "rejected",
        comments: comments || undefined,
      });
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? filteredRequests.filter(r => selectedRows.has(r.id))
      : filteredRequests;
    
    exportToCSV(dataToExport, columns, "leave_requests");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(r => r.id)));
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

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(r => selectedRows.has(r.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (request: LeaveRequestWithDetails, column: ColumnDef) => {
    const value = getColumnValue(request, column);

    if (column.id === 'employee_name') {
      return (
        <EmployeeCell
          avatarUrl={request.employee?.avatar_url}
          firstName={request.employee?.first_name}
          lastName={request.employee?.last_name}
          employeeId={request.employee?.employee_id}
        />
      );
    }

    if (column.id === 'leave_type') {
      return (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: request.leave_type?.color || "#888" }}
          />
          {value}
        </span>
      );
    }

    if (column.id === 'start_date' || column.id === 'end_date') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'created_at') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'status') {
      return <StatusBadge status={value as "pending" | "approved" | "rejected"} />;
    }

    if (column.id === 'reason') {
      return <span className="max-w-xs truncate block">{value || "—"}</span>;
    }

    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Leave Management" description="Review and manage employee leave requests" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
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
      <PageHeader
        title="Leave Management"
        description="Review and manage employee leave requests"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approvedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CalendarX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{rejectedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.id} 
                    className="whitespace-nowrap cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {sortColumn === column.id ? (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-4 w-4" /> 
                          : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No leave requests found</h3>
                        <p className="text-muted-foreground text-sm">
                          {search || statusFilter !== "all" ? "Try adjusting your filters" : "No leave requests have been submitted yet"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(request.id)}
                        onCheckedChange={(checked) => handleSelectRow(request.id, !!checked)}
                        aria-label={`Select request`}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className="whitespace-nowrap">
                        {renderCellValue(request, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleAction(request, "reject")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleAction(request, "approve")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
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
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this leave request?"
                : "Please provide a reason for rejecting this leave request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedRequest.employee?.avatar_url || undefined} />
                  <AvatarFallback>{getEmployeeInitials(selectedRequest)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getEmployeeName(selectedRequest)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.leave_type?.name || "Leave"} • {selectedRequest.days} days
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">{format(new Date(selectedRequest.start_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p className="font-medium">{format(new Date(selectedRequest.end_date), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedRequest.reason || "No reason provided"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Comments {actionType === "reject" && "(required)"}
                </p>
                <Textarea
                  placeholder="Add your comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={actionType === "reject" && !comments || updateLeaveRequest.isPending}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
