import { useState, useMemo } from "react";
import { useHasPermission } from "@/components/auth/PermissionGate";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon } from "lucide-react";
import { useAttendanceRecords } from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import { useAllLocations } from "@/hooks/useLocations";
import { usePagination } from "@/hooks/usePagination";
import { format, isWithinInterval, startOfDay, endOfDay, isToday } from "date-fns";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { EmployeeCell } from "@/components/shared/EmployeeCell";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: "employee_name", visible: true },
  { id: "employee_id", header: "Employee ID", accessor: "employee_code", visible: false },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "store", header: "Location", accessor: "store_name", visible: true },
  { id: "date", header: "Date", accessor: "date", visible: true },
  { id: "check_in", header: "Clock In", accessor: "check_in", visible: true },
  { id: "check_out", header: "Clock Out", accessor: "check_out", visible: true },
  { id: "break_duration", header: "Break", accessor: "break_duration", visible: true },
  { id: "work_hours", header: "Total Hours", accessor: "work_hours", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function AllAttendance() {
  const [viewMode, setViewMode] = useState<"all" | "today">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>("date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: attendanceRecords = [], isLoading: attendanceLoading, refetch, isFetching } = useAttendanceRecords();
  const { data: locations = [] } = useAllLocations();

  const isLoading = employeesLoading || attendanceLoading;

  // Transform attendance records with employee info
  const transformedRecords = useMemo(() => {
    return attendanceRecords.map((record: any) => {
      const employee = employees.find(e => e.id === record.employee_id);
      const location = locations.find(s => s.id === record.store_id);
      return {
        ...record,
        employee_name: employee ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : 'Unknown',
        employee_code: employee?.employee_id || '-',
        department: employee?.department?.name || '-',
        store_name: location?.name || '-',
        avatar_url: employee?.avatar_url || null,
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        break_duration: record.break_duration || '-',
      };
    });
  }, [attendanceRecords, employees, locations]);

  const filteredRecords = useMemo(() => {
    return transformedRecords.filter((record) => {
      const matchesSearch =
        record.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_code.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesLocation = locationFilter === "all" || record.store_id === locationFilter;

      // Filter by view mode
      const recordDate = new Date(record.date);
      let matchesDate = true;
      
      if (viewMode === "today") {
        matchesDate = isToday(recordDate);
      } else if (dateRange?.from) {
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchesDate = isWithinInterval(recordDate, { start: from, end: to });
      }

      return matchesSearch && matchesStatus && matchesLocation && matchesDate;
    });
  }, [transformedRecords, search, statusFilter, locationFilter, viewMode, dateRange]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const sortedRecords = useMemo(() => {
    if (!sortColumn) return filteredRecords;
    
    return [...filteredRecords].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getNestedValue(a, column.accessor as string);
      const bValue = getNestedValue(b, column.accessor as string);
      
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
  }, [filteredRecords, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRecords, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? sortedRecords.filter(rec => selectedRows.has(rec.id))
      : sortedRecords;
    
    exportToCSV(dataToExport, columns, "attendance_records");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(rec => rec.id)));
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
    paginatedData.every(rec => selectedRows.has(rec.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (record: any, column: ColumnDef) => {
    const value = typeof column.accessor === 'function' 
      ? column.accessor(record)
      : getNestedValue(record, column.accessor);

    if (column.id === 'employee_name') {
      return (
        <EmployeeCell
          avatarUrl={record.avatar_url}
          firstName={record.first_name}
          lastName={record.last_name}
          employeeId={record.employee_code}
        />
      );
    }

    if (column.id === 'status') {
      return <StatusBadge status={value as StatusType} />;
    }

    if (column.id === 'date') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'work_hours') {
      return value ? `${value}h` : "—";
    }

    if (column.id === 'check_in' || column.id === 'check_out') {
      return value || "—";
    }

    if (column.id === 'id') {
      return value ? (
        <span className="font-mono text-xs">{value.substring(0, 8)}...</span>
      ) : "—";
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="All Attendance" description="View all attendance records" />
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Attendance</h1>
          <p className="text-muted-foreground">View all employee attendance records</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "today")}>
          <TabsList>
            <TabsTrigger value="all">All Attendance</TabsTrigger>
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
                  placeholder="Search by name or employee ID..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {viewMode === "all" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full md:w-[280px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
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
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(record.id)}
                      onCheckedChange={(checked) => handleSelectRow(record.id, !!checked)}
                      aria-label={`Select ${record.employee_name}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(record, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {paginatedData.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No attendance records found</h3>
                <p className="text-muted-foreground text-sm">
                  {search || statusFilter !== "all" || locationFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "No attendance records have been logged yet"}
                </p>
              </div>
            </div>
          </div>
        )}

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
