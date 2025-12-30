import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Plus, CalendarCheck, Clock, CalendarX, ArrowUpDown, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { useCurrentEmployee, useLeaveBalances } from "@/hooks/useCurrentEmployee";
import { useLeaveTypes, useMyLeaveRequests, useCreateLeaveRequest, useCancelLeaveRequest } from "@/hooks/useLeaves";
import { DatePicker } from "@/components/ui/date-picker";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const defaultColumns: ColumnDef[] = [
  { id: "employee", header: "Employee", accessor: "employee", visible: true },
  { id: "email", header: "Email", accessor: "email", visible: true },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "store", header: "Store/Location", accessor: "store", visible: true },
  { id: "leave_type", header: "Leave Type", accessor: "leave_type.name", visible: true },
  { id: "start_date", header: "From", accessor: "start_date", visible: true },
  { id: "end_date", header: "To", accessor: "end_date", visible: true },
  { id: "days", header: "Days", accessor: "days", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "created_at", header: "Applied On", accessor: "created_at", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

const dateRangePresets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
];

export default function EmployeeLeaves() {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: leaveTypes = [], isLoading: typesLoading } = useLeaveTypes();
  const { data: leaveBalances = [], isLoading: balancesLoading } = useLeaveBalances(employee?.id);
  const { data: myLeaves = [], isLoading: leavesLoading, refetch } = useMyLeaveRequests();
  
  const createLeave = useCreateLeaveRequest();
  const cancelLeave = useCancelLeaveRequest();

  const hasActiveFilters = statusFilter !== "all" || leaveTypeFilter !== "all" || searchQuery || dateRange?.from;

  const handleClearFilters = () => {
    setStatusFilter("all");
    setLeaveTypeFilter("all");
    setSearchQuery("");
    setDateRange(undefined);
  };

  // Filter by status, leave type, search, and date range
  const filteredLeaves = useMemo(() => {
    let data = [...myLeaves];
    
    if (statusFilter !== "all") {
      data = data.filter((l) => l.status === statusFilter);
    }
    
    if (leaveTypeFilter !== "all") {
      data = data.filter((l) => l.leave_type_id === leaveTypeFilter);
    }
    
    if (searchQuery) {
      data = data.filter((l) => 
        l.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (dateRange?.from) {
      data = data.filter((l) => {
        const leaveStart = parseISO(l.start_date);
        return isWithinInterval(leaveStart, {
          start: dateRange.from!,
          end: dateRange.to || dateRange.from!,
        });
      });
    }
    
    return data;
  }, [myLeaves, statusFilter, leaveTypeFilter, searchQuery, dateRange]);

  // Sort
  const sortedLeaves = useMemo(() => {
    if (!sortConfig) return filteredLeaves;
    return [...filteredLeaves].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      if (sortConfig.key === "leave_type") {
        aValue = a.leave_type?.name || "";
        bValue = b.leave_type?.name || "";
      }
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLeaves, sortConfig]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedLeaves, defaultPageSize: 10 });

  const pendingLeaves = myLeaves.filter((r) => r.status === "pending");
  const approvedLeaves = myLeaves.filter((r) => r.status === "approved");

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApplyLeave = () => {
    if (!employee?.id || !leaveType || !startDate || !endDate) return;

    createLeave.mutate(
      {
        employee_id: employee.id,
        leave_type_id: leaveType,
        start_date: startDate,
        end_date: endDate,
        days: calculateDays(),
        reason,
      },
      {
        onSuccess: () => {
          setIsApplyDialogOpen(false);
          setLeaveType("");
          setStartDate("");
          setEndDate("");
          setReason("");
        },
      }
    );
  };

  const handleCancelLeave = (id: string) => {
    cancelLeave.mutate(id);
  };

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
      ? sortedLeaves.filter((l) => selectedRows.has(l.id))
      : sortedLeaves;
    
    const exportData = dataToExport.map((l) => ({
      ...l,
      leave_type: l.leave_type?.name || "",
      created_at: new Date(l.created_at).toLocaleDateString(),
      department: employee?.department?.name || "-",
      store: employee?.primary_store?.name || "-",
    }));
    exportToCSV(exportData, columns, "leave-requests");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((l) => l.id)));
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

  const isLoading = employeeLoading || typesLoading || balancesLoading || leavesLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Leave History" description="Apply for leaves and view your leave history" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader title="Leave History" description="Apply for leaves and view your leave history" />


      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingLeaves.length}</p>
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
              <p className="text-2xl font-semibold">{approvedLeaves.length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarX className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {leaveBalances.reduce((sum, b) => sum + Number(b.used_days), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Days Used (YTD)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={leavesLoading}
          onAddRow={() => setIsApplyDialogOpen(true)}
          addRowLabel="Apply Leave"
        />

        {showFilters && (
          <div className="p-4 border-b bg-muted/30 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date Range Preset */}
              <Select
                value=""
                onValueChange={(value) => {
                  const preset = dateRangePresets.find((p) => p.label === value);
                  if (preset) setDateRange(preset.getValue());
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRangePresets.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Leave Type Filter */}
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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

        <ScrollArea className="w-full whitespace-nowrap" hideScrollbar={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((l) => selectedRows.has(l.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>
                  {col.id !== "employee" && col.id !== "email" && col.id !== "department" && col.id !== "store" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort(col.id)}
                    >
                      {col.header}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? paginatedData.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(leave.id)}
                    onCheckedChange={(checked) => handleSelectRow(leave.id, checked as boolean)}
                  />
                </TableCell>
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    {col.id === "employee" ? (
                      <EmployeeCell
                        avatarUrl={employee?.avatar_url}
                        firstName={employee?.first_name}
                        lastName={employee?.last_name}
                        employeeId={employee?.employee_id}
                      />
                    ) : col.id === "email" ? (
                      <span className="text-muted-foreground">{employee?.email || "-"}</span>
                    ) : col.id === "department" ? (
                      <span>{employee?.department?.name || "-"}</span>
                    ) : col.id === "store" ? (
                      <span>{employee?.primary_store?.name || "-"}</span>
                    ) : col.id === "leave_type" ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: leave.leave_type?.color || "#3B82F6" }}
                        />
                        {leave.leave_type?.name || "Leave"}
                      </div>
                    ) : col.id === "status" ? (
                      <StatusBadge status={leave.status as any} />
                    ) : col.id === "created_at" ? (
                      <span className="text-muted-foreground">
                        {new Date(leave.created_at).toLocaleDateString()}
                      </span>
                    ) : col.id === "reason" ? (
                      <span className="max-w-xs truncate block">{leave.reason || "-"}</span>
                    ) : (
                      leave[col.id as keyof typeof leave] || "-"
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {leave.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelLeave(leave.id)}
                      disabled={cancelLeave.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center text-muted-foreground py-8">
                  No leave requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => {
                    const balance = leaveBalances.find((b) => b.leave_type_id === type.id);
                    const available = balance
                      ? Number(balance.total_days) - Number(balance.used_days) - Number(balance.pending_days)
                      : 0;
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: type.color || "#3B82F6" }}
                          />
                          {type.name} ({available} available)
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {startDate && endDate && (
              <p className="text-sm text-muted-foreground">
                Duration: {calculateDays()} day(s)
              </p>
            )}

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyLeave}
              disabled={!leaveType || !startDate || !endDate || createLeave.isPending}
            >
              {createLeave.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
