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
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Clock, CheckCircle, XCircle, AlertCircle, Timer, ArrowUpDown, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyAttendance } from "@/hooks/useAttendance";
import { useAllLocations } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { subDays, startOfMonth, endOfMonth, subMonths, format, parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

const defaultColumns: ColumnDef[] = [
  { id: "employee", header: "Employee", accessor: "employee", visible: true },
  { id: "email", header: "Email", accessor: "email", visible: true },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "store", header: "Store/Location", accessor: "store", visible: true },
  { id: "date", header: "Date", accessor: "date", visible: true },
  { id: "check_in", header: "Check In", accessor: "check_in", visible: true },
  { id: "check_out", header: "Check Out", accessor: "check_out", visible: true },
  { id: "work_hours", header: "Work Hours", accessor: "work_hours", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

const datePresets = [
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last 3 months", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
];

export default function EmployeeAttendance() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days");
  const [showFilters, setShowFilters] = useState(true);

  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: myRecords = [], isLoading: recordsLoading, refetch } = useMyAttendance();
  const { data: locations = [] } = useAllLocations();

  // Get store name from location id
  const getStoreName = (storeId: string | null) => {
    if (!storeId) return employee?.primary_store?.name || "-";
    const location = locations.find((l) => l.id === storeId);
    return location?.name || "-";
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(myRecords.map((r) => r.status));
    return Array.from(statuses).sort();
  }, [myRecords]);

  // Filter records by date range, status, and search
  const filteredRecords = useMemo(() => {
    return myRecords.filter((r) => {
      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const recordDate = new Date(r.date);
        if (dateRange.from && dateRange.to) {
          if (!isWithinInterval(recordDate, { start: dateRange.from, end: dateRange.to })) {
            return false;
          }
        } else if (dateRange.from && recordDate < dateRange.from) {
          return false;
        } else if (dateRange.to && recordDate > dateRange.to) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const dateStr = r.date.toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        const status = r.status.toLowerCase();
        if (!dateStr.includes(query) && !notes.includes(query) && !status.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [myRecords, dateRange, statusFilter, searchQuery]);

  // Sort records
  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortConfig]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRecords, defaultPageSize: 10 });

  // Calculate stats
  const present = filteredRecords.filter((r) => r.status === "present").length;
  const late = filteredRecords.filter((r) => r.status === "late").length;
  const absent = filteredRecords.filter((r) => r.status === "absent").length;
  const leaves = filteredRecords.filter((r) => r.status === "on-leave").length;
  const totalHours = filteredRecords.reduce((sum, r) => sum + Number(r.work_hours || 0), 0);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === "Custom") return;
    const presetConfig = datePresets.find((p) => p.label === preset);
    if (presetConfig) {
      setDateRange(presetConfig.getValue());
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedPreset("Custom");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedPreset("Last 30 days");
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || selectedPreset !== "Last 30 days";

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
      ? sortedRecords.filter((r) => selectedRows.has(r.id))
      : sortedRecords;
    
    const exportData = dataToExport.map((r) => ({
      ...r,
      department: employee?.department?.name || "-",
      store: getStoreName(r.store_id),
    }));
    exportToCSV(exportData, columns, "attendance-records");
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

  const isLoading = employeeLoading || recordsLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Log" description="View your attendance records and summary" />
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader title="Attendance Log" description="View your attendance records and summary" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{leaves}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={recordsLoading}
        />

        {/* Filters Section */}
        {showFilters && (
          <div className="p-4 border-b bg-muted/30 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date Range Preset */}
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal min-w-[240px]",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
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
                  checked={paginatedData.length > 0 && paginatedData.every((r) => selectedRows.has(r.id))}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(record.id)}
                      onCheckedChange={(checked) => handleSelectRow(record.id, checked as boolean)}
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
                        <span>{getStoreName(record.store_id)}</span>
                      ) : col.id === "status" ? (
                        <StatusBadge status={record.status as any} />
                      ) : col.id === "work_hours" ? (
                        record.work_hours ? `${Number(record.work_hours).toFixed(1)}h` : "-"
                      ) : (
                        record[col.id as keyof typeof record] || "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-8">
                  No attendance records found for the selected filters
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