import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { useHasPermission } from "@/components/auth/PermissionGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Check, X, Eye, Clock, CheckCircle, XCircle, Search, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  useAllRegularizationRequests,
  useReviewRegularizationRequest,
} from "@/hooks/useAttendanceRegularization";
import { format } from "date-fns";
import { toast } from "sonner";

const requestTypeLabels: Record<string, string> = {
  correction: "Time Correction",
  missing_entry: "Missing Entry",
  overtime: "Overtime Claim",
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: (row: any) => {
    if (row.employee?.profile) {
      const { first_name, last_name } = row.employee.profile;
      return `${first_name || ""} ${last_name || ""}`.trim() || row.employee.employee_id;
    }
    return row.employee?.employee_id || "Unknown";
  }, visible: true },
  { id: "request_date", header: "Date", accessor: "request_date", visible: true },
  { id: "request_type", header: "Type", accessor: (row: any) => requestTypeLabels[row.request_type] || row.request_type, visible: true },
  { id: "original_time", header: "Original Time", accessor: (row: any) => `${row.original_check_in || "-"} - ${row.original_check_out || "-"}`, visible: true },
  { id: "requested_time", header: "Requested Time", accessor: (row: any) => `${row.requested_check_in || "-"} - ${row.requested_check_out || "-"}`, visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function AttendanceRegularizationPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [comments, setComments] = useState("");

  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: requests = [], isLoading, refetch, isFetching } = useAllRegularizationRequests(statusFilter === "all" ? undefined : statusFilter);
  const reviewMutation = useReviewRegularizationRequest();

  const canUpdate = useHasPermission("Attendance", "update");

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const approvedCount = requests.filter((r: any) => r.status === "approved").length;
  const rejectedCount = requests.filter((r: any) => r.status === "rejected").length;

  const getEmployeeName = (request: any) => {
    if (request.employee?.profile) {
      const { first_name, last_name } = request.employee.profile;
      return `${first_name || ""} ${last_name || ""}`.trim() || request.employee.employee_id;
    }
    return request.employee?.employee_id || "Unknown";
  };

  const filteredRequests = useMemo(() => 
    requests.filter((r: any) => {
      const name = getEmployeeName(r).toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      return matchesSearch;
    }), [requests, search]);

  const getColumnValue = (request: any, column: ColumnDef): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(request);
    }
    return request[column.accessor];
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

  const handleReview = () => {
    if (!selectedRequest || !reviewAction) return;

    reviewMutation.mutate(
      {
        id: selectedRequest.id,
        status: reviewAction,
        review_comments: comments,
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setReviewAction(null);
          setComments("");
        },
      }
    );
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
      ? filteredRequests.filter((r: any) => selectedRows.has(r.id))
      : filteredRequests;
    
    exportToCSV(dataToExport, columns, "attendance_regularization");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((r: any) => r.id)));
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
    paginatedData.every((r: any) => selectedRows.has(r.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (request: any, column: ColumnDef) => {
    const value = getColumnValue(request, column);

    if (column.id === 'request_date') {
      return value ? format(new Date(value), "MMM d, yyyy") : "—";
    }

    if (column.id === 'request_type') {
      return <Badge variant="outline">{value}</Badge>;
    }

    if (column.id === 'original_time') {
      return <span className="text-muted-foreground">{value}</span>;
    }

    if (column.id === 'requested_time') {
      return <span className="font-medium text-primary">{value}</span>;
    }

    if (column.id === 'reason') {
      return <span className="max-w-[200px] truncate block">{value}</span>;
    }

    if (column.id === 'status') {
      return <StatusBadge status={value as any} />;
    }

    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Attendance Regularization"
          description="Review and manage attendance correction requests"
        />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Regularization"
        description="Review and manage attendance correction requests"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{rejectedCount}</p>
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
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No regularization requests found</h3>
                        <p className="text-muted-foreground text-sm">
                          {search ? "Try adjusting your search" : "No attendance correction requests yet"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((request: any) => (
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
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && canUpdate && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction("approved");
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction("rejected");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setReviewAction(null);
          setComments("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction
                ? `${reviewAction === "approved" ? "Approve" : "Reject"} Request`
                : "Request Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee</p>
                  <p className="font-medium">{getEmployeeName(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.request_date), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Original Time</p>
                  <p className="p-2 bg-muted rounded">
                    {selectedRequest.original_check_in || "—"} to{" "}
                    {selectedRequest.original_check_out || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Time</p>
                  <p className="p-2 bg-primary/10 rounded font-medium">
                    {selectedRequest.requested_check_in || "—"} to{" "}
                    {selectedRequest.requested_check_out || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-sm mt-1">{selectedRequest.reason}</p>
              </div>

              {reviewAction && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Review Comments (Optional)
                  </p>
                  <Textarea
                    placeholder="Add any comments about this decision..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setReviewAction(null);
                setComments("");
              }}
            >
              Cancel
            </Button>
            {reviewAction && (
              <Button
                variant={reviewAction === "approved" ? "default" : "destructive"}
                onClick={handleReview}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending
                  ? "Processing..."
                  : reviewAction === "approved"
                  ? "Approve & Update Attendance"
                  : "Reject"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
