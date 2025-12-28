import { useState, useMemo } from "react";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import {
  ArrowLeftRight,
  Search,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useShiftExchangeRequests,
  useCreateShiftExchangeRequest,
  useUpdateShiftExchangeRequest,
  type ShiftExchangeRequest,
} from "@/hooks/useShiftExchange";
import { useShiftAssignments, useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function ShiftExchange() {
  const queryClient = useQueryClient();
  const { data: exchanges = [], isLoading, isFetching } = useShiftExchangeRequests();
  const { data: shiftAssignments = [] } = useShiftAssignments();
  const { data: shifts = [] } = useShifts();
  const { data: employees = [] } = useEmployees();
  const createExchange = useCreateShiftExchangeRequest();
  const updateExchange = useUpdateShiftExchangeRequest();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ShiftExchangeRequest | null>(null);
  const [responseAction, setResponseAction] = useState<"approve" | "reject">("approve");
  const [responseNote, setResponseNote] = useState("");
  
  // Table state
  const [sortColumn, setSortColumn] = useState<string>("request_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "requester", header: "Requester", visible: true },
    { id: "target", header: "Target Employee", visible: true },
    { id: "request_date", header: "Date", visible: true },
    { id: "status", header: "Status", visible: true },
    { id: "reason", header: "Reason", visible: false },
    { id: "actions", header: "Actions", visible: true },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    requesterId: "",
    targetEmployeeId: "",
    requestDate: "",
    reason: "",
  });

  // Helper to get employee name
  const getEmployeeName = (exchange: ShiftExchangeRequest, type: "requester" | "target") => {
    const emp = type === "requester" ? exchange.requester : exchange.target_employee;
    if (emp?.profile?.first_name || emp?.profile?.last_name) {
      return `${emp.profile.first_name || ""} ${emp.profile.last_name || ""}`.trim();
    }
    return emp?.employee_id || "Unknown";
  };

  const filteredExchanges = useMemo(() => {
    return exchanges.filter((exchange) => {
      const requesterName = getEmployeeName(exchange, "requester");
      const targetName = getEmployeeName(exchange, "target");
      const matchesSearch =
        requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        targetName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || exchange.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exchanges, searchQuery, statusFilter]);

  const sortedExchanges = useMemo(() => {
    return [...filteredExchanges].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "requester":
          aVal = getEmployeeName(a, "requester");
          bVal = getEmployeeName(b, "requester");
          break;
        case "target":
          aVal = getEmployeeName(a, "target");
          bVal = getEmployeeName(b, "target");
          break;
        case "request_date":
          aVal = new Date(a.request_date).getTime();
          bVal = new Date(b.request_date).getTime();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredExchanges, sortColumn, sortDirection]);

  const pagination = usePagination({ data: sortedExchanges, defaultPageSize: 10 });
  const paginatedItems = pagination.paginatedData;

  const stats = {
    total: exchanges.length,
    pending: exchanges.filter((e) => e.status === "pending").length,
    approved: exchanges.filter((e) => e.status === "approved").length,
    rejected: exchanges.filter((e) => e.status === "rejected").length,
  };

  // Get shift assignment for an employee
  const getEmployeeAssignment = (employeeId: string) => {
    return shiftAssignments.find((a) => a.employee_id === employeeId && a.is_active);
  };

  // Get shift by id
  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId);
  };

  // Get available employees with their shifts
  const employeesWithShifts = employees.map((emp) => {
    const assignment = getEmployeeAssignment(emp.id);
    const shift = assignment ? getShift(assignment.shift_id) : null;
    const name = emp.first_name || emp.last_name
      ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
      : emp.employee_id;
    return {
      id: emp.id,
      name,
      shiftId: shift?.id,
      shiftName: shift?.name || "No Shift",
    };
  }).filter((e) => e.shiftId);

  const handleCreateExchange = () => {
    const requesterAssignment = getEmployeeAssignment(formData.requesterId);
    const targetAssignment = getEmployeeAssignment(formData.targetEmployeeId);

    if (!requesterAssignment || !targetAssignment) {
      return;
    }

    createExchange.mutate(
      {
        requester_id: formData.requesterId,
        target_employee_id: formData.targetEmployeeId,
        requester_shift_id: requesterAssignment.shift_id,
        target_shift_id: targetAssignment.shift_id,
        request_date: formData.requestDate,
        reason: formData.reason,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ requesterId: "", targetEmployeeId: "", requestDate: "", reason: "" });
        },
      }
    );
  };

  const handleResponse = () => {
    if (!selectedExchange) return;

    updateExchange.mutate(
      {
        id: selectedExchange.id,
        status: responseAction === "approve" ? "approved" : "rejected",
        response_note: responseNote,
      },
      {
        onSuccess: () => {
          setIsResponseOpen(false);
          setResponseNote("");
          setSelectedExchange(null);
        },
      }
    );
  };

  const openResponseDialog = (exchange: ShiftExchangeRequest, action: "approve" | "reject") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsResponseOpen(true);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedItems.map((e) => e.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const data = sortedExchanges.map(e => ({
      requester: getEmployeeName(e, "requester"),
      target: getEmployeeName(e, "target"),
      request_date: format(new Date(e.request_date), "yyyy-MM-dd"),
      status: e.status,
      reason: e.reason || "",
    }));
    exportToCSV(data, columns, "shift-exchanges");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Shift Exchange Requests" description="Manage employee shift swap requests" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Total Requests" value={stats.total} icon={ArrowLeftRight} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} />
      </div>

      {/* Exchange Requests Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => setIsCreateOpen(true)}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="New Request"
        />

        {showFilter && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.find(c => c.id === "requester")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("requester")}>
                    <div className="flex items-center">Requester {getSortIcon("requester")}</div>
                  </TableHead>
                )}
                <TableHead className="text-center w-12">
                  <ArrowLeftRight className="h-4 w-4 mx-auto" />
                </TableHead>
                {columns.find(c => c.id === "target")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("target")}>
                    <div className="flex items-center">Target Employee {getSortIcon("target")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "request_date")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("request_date")}>
                    <div className="flex items-center">Date {getSortIcon("request_date")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "status")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">Status {getSortIcon("status")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "reason")?.visible && (
                  <TableHead>Reason</TableHead>
                )}
                {columns.find(c => c.id === "actions")?.visible && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No exchange requests found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((exchange) => {
                  const StatusIcon = statusConfig[exchange.status]?.icon || Clock;
                  return (
                    <TableRow key={exchange.id} data-state={selectedRows.includes(exchange.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(exchange.id)}
                          onCheckedChange={(checked) => handleSelectRow(exchange.id, !!checked)}
                        />
                      </TableCell>
                      {columns.find(c => c.id === "requester")?.visible && (
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{getEmployeeName(exchange, "requester")}</span>
                            {exchange.requester_shift && (
                              <ShiftBadge
                                name={exchange.requester_shift.name}
                                color={exchange.requester_shift.color || "#3B82F6"}
                              />
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground mx-auto" />
                      </TableCell>
                      {columns.find(c => c.id === "target")?.visible && (
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{getEmployeeName(exchange, "target")}</span>
                            {exchange.target_shift && (
                              <ShiftBadge
                                name={exchange.target_shift.name}
                                color={exchange.target_shift.color || "#3B82F6"}
                              />
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columns.find(c => c.id === "request_date")?.visible && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(exchange.request_date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                      )}
                      {columns.find(c => c.id === "status")?.visible && (
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              statusConfig[exchange.status]?.className || ""
                            }`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig[exchange.status]?.label || exchange.status}
                          </span>
                        </TableCell>
                      )}
                      {columns.find(c => c.id === "reason")?.visible && (
                        <TableCell className="max-w-[200px] truncate">
                          {exchange.reason || "-"}
                        </TableCell>
                      )}
                      {columns.find(c => c.id === "actions")?.visible && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedExchange(exchange);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {exchange.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => openResponseDialog(exchange, "approve")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openResponseDialog(exchange, "reject")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requesting Employee</label>
              <Select
                value={formData.requesterId}
                onValueChange={(value) => setFormData({ ...formData, requesterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithShifts.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.shiftName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Employee</label>
              <Select
                value={formData.targetEmployeeId}
                onValueChange={(value) => setFormData({ ...formData, targetEmployeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to swap with" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithShifts
                    .filter((e) => e.id !== formData.requesterId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.shiftName})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange Date</label>
              <Input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Reason for exchange..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateExchange}
              disabled={!formData.requesterId || !formData.targetEmployeeId || !formData.requestDate || createExchange.isPending}
            >
              {createExchange.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exchange Request Details</DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="font-medium">{getEmployeeName(selectedExchange, "requester")}</p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge
                      name={selectedExchange.requester_shift.name}
                      color={selectedExchange.requester_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">{getEmployeeName(selectedExchange, "target")}</p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge
                      name={selectedExchange.target_shift.name}
                      color={selectedExchange.target_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(selectedExchange.request_date), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[selectedExchange.status]?.className}`}>
                    {statusConfig[selectedExchange.status]?.label}
                  </span>
                </div>
                {selectedExchange.reason && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Reason:</span>
                    <p className="text-sm">{selectedExchange.reason}</p>
                  </div>
                )}
                {selectedExchange.response_note && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Response Note:</span>
                    <p className="text-sm">{selectedExchange.response_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseAction === "approve" ? "Approve" : "Reject"} Exchange Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Note (Optional)</label>
              <Textarea
                placeholder="Add a note..."
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={responseAction === "approve" ? "default" : "destructive"}
              onClick={handleResponse}
              disabled={updateExchange.isPending}
            >
              {updateExchange.isPending ? "Processing..." : responseAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
