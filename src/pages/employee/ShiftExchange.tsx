import { useState, useMemo } from "react";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import {
  ArrowLeftRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  Eye,
  User,
  AlertCircle,
  Inbox,
  Send,
  Check,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";
import {
  useMyShiftExchangeRequests,
  useCreateShiftExchangeRequest,
  useUpdateShiftExchangeRequest,
  useCancelShiftExchangeRequest,
  type ShiftExchangeRequest,
} from "@/hooks/useShiftExchange";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyShiftAssignment, useShiftAssignments, useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

type SortField = "request_date" | "status" | "created_at";
type SortDirection = "asc" | "desc";

export default function EmployeeShiftExchange() {
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee();
  const { data: myShiftAssignments = [] } = useMyShiftAssignment(currentEmployee?.id);
  const { data: allExchanges = [], isLoading: isLoadingExchanges, isFetching } = useMyShiftExchangeRequests(currentEmployee?.id);
  const { data: shiftAssignments = [] } = useShiftAssignments();
  const { data: shifts = [] } = useShifts();
  const { data: employees = [] } = useEmployees();
  const queryClient = useQueryClient();

  const myShiftAssignment = Array.isArray(myShiftAssignments) ? myShiftAssignments[0] : myShiftAssignments;

  const createExchange = useCreateShiftExchangeRequest();
  const updateExchange = useUpdateShiftExchangeRequest();
  const cancelExchange = useCancelShiftExchangeRequest();

  const myRequests = allExchanges.filter((e) => e.requester_id === currentEmployee?.id);
  const incomingRequests = allExchanges.filter(
    (e) => e.target_employee_id === currentEmployee?.id && e.status === "pending"
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ShiftExchangeRequest | null>(null);
  const [responseAction, setResponseAction] = useState<"accept" | "decline">("accept");
  const [responseNote, setResponseNote] = useState("");
  const [activeTab, setActiveTab] = useState(incomingRequests.length > 0 ? "incoming" : "sent");

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "request_date", header: "Exchange Date", visible: true },
    { id: "target_employee", header: "With Employee", visible: true },
    { id: "shifts", header: "Shifts", visible: true },
    { id: "status", header: "Status", visible: true },
    { id: "created_at", header: "Created", visible: true },
  ]);

  const [formData, setFormData] = useState({
    targetEmployeeId: "",
    requestDate: "",
    reason: "",
  });

  const currentShift = myShiftAssignment ? {
    id: myShiftAssignment.shift_id,
    name: myShiftAssignment.shift_name || '',
    color: myShiftAssignment.shift_color || myShiftAssignment.color || '#3B82F6',
    start_time: myShiftAssignment.start_time || '',
    end_time: myShiftAssignment.end_time || '',
  } : null;

  const getEmployeeName = (exchange: ShiftExchangeRequest, type: "requester" | "target") => {
    const emp = type === "requester" ? exchange.requester : exchange.target_employee;
    if (emp?.profile?.first_name || emp?.profile?.last_name) {
      return `${emp.profile.first_name || ""} ${emp.profile.last_name || ""}`.trim();
    }
    return emp?.employee_id || "Unknown";
  };

  const getEmployeeAssignment = (employeeId: string) => {
    return shiftAssignments.find((a) => a.employee_id === employeeId && a.is_active);
  };

  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId);
  };

  const employeesWithShifts = employees
    .filter((emp) => emp.id !== currentEmployee?.id)
    .map((emp) => {
      const assignment = getEmployeeAssignment(emp.id);
      const shift = assignment ? getShift(assignment.shift_id) : null;
      const name = emp.first_name || emp.last_name
        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
        : emp.employee_id;
      return { id: emp.id, name, shiftId: shift?.id, shiftName: shift?.name || "No Shift" };
    })
    .filter((e) => e.shiftId);

  // Filter and sort
  const filteredMyRequests = useMemo(() => {
    let data = [...myRequests];
    if (searchQuery) {
      data = data.filter((r) =>
        getEmployeeName(r, "target").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }
    return data.sort((a, b) => {
      let aVal = "", bVal = "";
      switch (sortField) {
        case "request_date": aVal = a.request_date; bVal = b.request_date; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "created_at": aVal = a.created_at; bVal = b.created_at; break;
      }
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [myRequests, searchQuery, statusFilter, sortField, sortDirection]);

  const filteredIncoming = useMemo(() => {
    let data = [...incomingRequests];
    if (searchQuery) {
      data = data.filter((r) =>
        getEmployeeName(r, "requester").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return data.sort((a, b) => {
      let aVal = "", bVal = "";
      switch (sortField) {
        case "request_date": aVal = a.request_date; bVal = b.request_date; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "created_at": aVal = a.created_at; bVal = b.created_at; break;
      }
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [incomingRequests, searchQuery, sortField, sortDirection]);

  const myPagination = usePagination({ data: filteredMyRequests, defaultPageSize: 10 });
  const incomingPagination = usePagination({ data: filteredIncoming, defaultPageSize: 10 });

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

  const handleSelectAll = (checked: boolean, data: ShiftExchangeRequest[]) => {
    if (checked) {
      setSelectedRows(data.map((r) => r.id));
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
    const data = activeTab === "sent" ? filteredMyRequests : filteredIncoming;
    const dataToExport = selectedRows.length > 0 ? data.filter((r) => selectedRows.includes(r.id)) : data;

    const exportData = dataToExport.map((r) => ({
      request_date: r.request_date,
      requester: getEmployeeName(r, "requester"),
      target: getEmployeeName(r, "target"),
      requester_shift: r.requester_shift?.name || "",
      target_shift: r.target_shift?.name || "",
      status: r.status,
      reason: r.reason || "",
      created_at: r.created_at,
    }));

    const exportColumns: ColumnDef[] = [
      { id: "request_date", header: "Exchange Date", visible: true },
      { id: "requester", header: "Requester", visible: true },
      { id: "target", header: "Target", visible: true },
      { id: "requester_shift", header: "Requester Shift", visible: true },
      { id: "target_shift", header: "Target Shift", visible: true },
      { id: "status", header: "Status", visible: true },
      { id: "reason", header: "Reason", visible: true },
      { id: "created_at", header: "Created", visible: true },
    ];

    exportToCSV(exportData, exportColumns, `shift-exchange-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success(`Exported ${dataToExport.length} requests`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
  };

  const handleCreateRequest = () => {
    if (!currentEmployee?.id || !myShiftAssignment) return;
    const targetAssignment = getEmployeeAssignment(formData.targetEmployeeId);
    if (!targetAssignment) return;

    createExchange.mutate(
      {
        requester_id: currentEmployee.id,
        target_employee_id: formData.targetEmployeeId,
        requester_shift_id: myShiftAssignment.shift_id,
        target_shift_id: targetAssignment.shift_id,
        request_date: formData.requestDate,
        reason: formData.reason,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
        },
      }
    );
  };

  const handleCancelRequest = (exchangeId: string) => {
    cancelExchange.mutate(exchangeId);
  };

  const handleRespondToRequest = () => {
    if (!selectedExchange) return;
    const newStatus = responseAction === "decline" ? "rejected" : "pending";

    updateExchange.mutate(
      {
        id: selectedExchange.id,
        status: newStatus,
        response_note: responseAction === "decline" ? responseNote : undefined,
      },
      {
        onSuccess: () => {
          setIsRespondOpen(false);
          setResponseNote("");
          setSelectedExchange(null);
        },
      }
    );
  };

  const openRespondDialog = (exchange: ShiftExchangeRequest, action: "accept" | "decline") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsRespondOpen(true);
  };

  const pendingCount = myRequests.filter((e) => e.status === "pending").length;
  const approvedCount = myRequests.filter((e) => e.status === "approved").length;

  if (isLoadingEmployee || isLoadingExchanges) {
    return (
      <PageContainer>
        <PageHeader title="Shift Exchange" description="Request to swap shifts with colleagues" />
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  const renderTable = (
    data: ShiftExchangeRequest[],
    pagination: typeof myPagination,
    isIncoming: boolean
  ) => (
    <Card>
      <DataTableToolbar
        columns={columns}
        onToggleColumn={handleToggleColumn}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onToggleFilter={() => setShowFilters(!showFilters)}
        showFilter={showFilters}
        isRefreshing={isFetching}
        onAddRow={!isIncoming ? () => setIsCreateOpen(true) : undefined}
        addRowLabel="New Request"
      />

      {showFilters && (
        <div className="px-4 py-3 border-b flex items-center gap-4 flex-wrap">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          {!isIncoming && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={pagination.paginatedData.length > 0 && selectedRows.length === pagination.paginatedData.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean, pagination.paginatedData)}
              />
            </TableHead>
            {columns.find((c) => c.id === "request_date")?.visible && (
              <TableHead><SortableHeader field="request_date">Exchange Date</SortableHeader></TableHead>
            )}
            {columns.find((c) => c.id === "target_employee")?.visible && (
              <TableHead>{isIncoming ? "From" : "With"}</TableHead>
            )}
            {columns.find((c) => c.id === "shifts")?.visible && (
              <TableHead>Shifts</TableHead>
            )}
            {columns.find((c) => c.id === "status")?.visible && (
              <TableHead><SortableHeader field="status">Status</SortableHeader></TableHead>
            )}
            {columns.find((c) => c.id === "created_at")?.visible && (
              <TableHead><SortableHeader field="created_at">Created</SortableHeader></TableHead>
            )}
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedData.map((exchange) => {
            const StatusIcon = statusConfig[exchange.status]?.icon || Clock;
            return (
              <TableRow key={exchange.id} data-state={selectedRows.includes(exchange.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(exchange.id)}
                    onCheckedChange={(checked) => handleSelectRow(exchange.id, checked as boolean)}
                  />
                </TableCell>
                {columns.find((c) => c.id === "request_date")?.visible && (
                  <TableCell className="font-medium">
                    {format(new Date(exchange.request_date), "MMM dd, yyyy")}
                  </TableCell>
                )}
                {columns.find((c) => c.id === "target_employee")?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>{getEmployeeName(exchange, isIncoming ? "requester" : "target")}</span>
                    </div>
                  </TableCell>
                )}
                {columns.find((c) => c.id === "shifts")?.visible && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {exchange.requester_shift && (
                        <ShiftBadge name={exchange.requester_shift.name} color={exchange.requester_shift.color || "#3B82F6"} />
                      )}
                      <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                      {exchange.target_shift && (
                        <ShiftBadge name={exchange.target_shift.name} color={exchange.target_shift.color || "#3B82F6"} />
                      )}
                    </div>
                  </TableCell>
                )}
                {columns.find((c) => c.id === "status")?.visible && (
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[exchange.status]?.className || ""}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig[exchange.status]?.label || exchange.status}
                    </span>
                  </TableCell>
                )}
                {columns.find((c) => c.id === "created_at")?.visible && (
                  <TableCell className="text-muted-foreground">
                    {format(new Date(exchange.created_at), "MMM dd, yyyy")}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedExchange(exchange); setIsViewOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isIncoming ? (
                      <>
                        <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => openRespondDialog(exchange, "accept")}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => openRespondDialog(exchange, "decline")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : exchange.status === "pending" && (
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleCancelRequest(exchange.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {pagination.paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {isIncoming ? "No incoming requests" : "No exchange requests"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={isIncoming ? filteredIncoming.length : filteredMyRequests.length}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader title="Shift Exchange" description="Request to swap shifts with colleagues" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{currentShift?.name || "None"}</p>
              <p className="text-sm text-muted-foreground">Current Shift</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{incomingRequests.length}</p>
              <p className="text-sm text-muted-foreground">Incoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="h-4 w-4" />
            Incoming
            {incomingRequests.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {incomingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {renderTable(filteredIncoming, incomingPagination, true)}
        </TabsContent>

        <TabsContent value="sent">
          {renderTable(filteredMyRequests, myPagination, false)}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Exchange</DialogTitle>
            <DialogDescription>Submit a request to swap your shift with a colleague</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Current Shift</p>
            <div className="flex items-center gap-2">
              {currentShift ? (
                <>
                  <ShiftBadge name={currentShift.name} color={currentShift.color || "#3B82F6"} />
                  <span className="text-sm">{currentShift.start_time} - {currentShift.end_time}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No shift assigned</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Swap With</label>
              <Select value={formData.targetEmployeeId} onValueChange={(value) => setFormData({ ...formData, targetEmployeeId: value })}>
                <SelectTrigger><SelectValue placeholder="Select colleague" /></SelectTrigger>
                <SelectContent>
                  {employeesWithShifts.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <span>{e.name}</span>
                        <span className="text-muted-foreground">({e.shiftName})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange Date</label>
              <DatePicker
                value={formData.requestDate}
                onChange={(value) => setFormData({ ...formData, requestDate: value })}
                placeholder="Select exchange date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Exchange</label>
              <Textarea
                placeholder="Explain why you need to swap shifts..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Your request will be reviewed by a manager. You'll be notified once it's approved or rejected.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest} disabled={!formData.targetEmployeeId || !formData.requestDate || !formData.reason || createExchange.isPending}>
              {createExchange.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exchange Request Details</DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedExchange.requester_id === currentEmployee?.id ? "You" : getEmployeeName(selectedExchange, "requester")}
                  </p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge name={selectedExchange.requester_shift.name} color={selectedExchange.requester_shift.color || "#3B82F6"} />
                  )}
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedExchange.target_employee_id === currentEmployee?.id ? "You" : getEmployeeName(selectedExchange, "target")}
                  </p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge name={selectedExchange.target_shift.name} color={selectedExchange.target_shift.color || "#3B82F6"} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Exchange Date</p>
                  <p className="font-medium">{format(new Date(selectedExchange.request_date), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[selectedExchange.status]?.className || ""}`}>
                    {statusConfig[selectedExchange.status]?.label || selectedExchange.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested On</p>
                  <p className="font-medium">{format(new Date(selectedExchange.created_at), "MMM d, yyyy")}</p>
                </div>
                {selectedExchange.responded_at && (
                  <div>
                    <p className="text-muted-foreground">Responded On</p>
                    <p className="font-medium">{format(new Date(selectedExchange.responded_at), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {selectedExchange.reason && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Reason</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedExchange.reason}</p>
                </div>
              )}

              {selectedExchange.response_note && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Response Note</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedExchange.response_note}</p>
                </div>
              )}

              {selectedExchange.status === "pending" && selectedExchange.requester_id === currentEmployee?.id && (
                <Button variant="destructive" className="w-full" onClick={() => { handleCancelRequest(selectedExchange.id); setIsViewOpen(false); }}>
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{responseAction === "accept" ? "Accept Shift Swap" : "Decline Shift Swap"}</DialogTitle>
            <DialogDescription>
              {responseAction === "accept"
                ? "By accepting, you agree to swap shifts. The request will still need manager approval."
                : "Let the requester know why you're declining."}
            </DialogDescription>
          </DialogHeader>

          {selectedExchange && (
            <div className="py-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                <div className="text-center">
                  <p className="text-sm font-medium">{getEmployeeName(selectedExchange, "requester")}</p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge name={selectedExchange.requester_shift.name} color={selectedExchange.requester_shift.color || "#3B82F6"} />
                  )}
                </div>
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">You</p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge name={selectedExchange.target_shift.name} color={selectedExchange.target_shift.color || "#3B82F6"} />
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Swap date: {format(new Date(selectedExchange.request_date), "MMMM d, yyyy")}
                </span>
              </div>

              {responseAction === "decline" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for declining (optional)</label>
                  <Textarea placeholder="Let them know why you can't swap..." value={responseNote} onChange={(e) => setResponseNote(e.target.value)} rows={3} />
                </div>
              )}

              {responseAction === "accept" && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Once you accept, the request will be sent to your manager for final approval.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRespondOpen(false)}>Cancel</Button>
            <Button variant={responseAction === "accept" ? "default" : "destructive"} onClick={handleRespondToRequest} disabled={updateExchange.isPending}>
              {updateExchange.isPending ? "Processing..." : responseAction === "accept" ? "Accept Swap" : "Decline Swap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
