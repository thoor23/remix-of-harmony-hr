import { useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Clock, CalendarX, Search, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { useLeaveRequests, useLeaveTypes } from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: "employee_name", visible: true },
  { id: "employee_id", header: "Employee ID", accessor: "employee_code", visible: true },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "total_leaves", header: "Total Leaves", accessor: "total_leaves", visible: true },
  { id: "used_leaves", header: "Used", accessor: "used_leaves", visible: true },
  { id: "pending_leaves", header: "Pending", accessor: "pending_leaves", visible: true },
  { id: "remaining_leaves", header: "Remaining", accessor: "remaining_leaves", visible: true },
];

export default function LeaveOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: leaveRequests = [], isLoading: leavesLoading, refetch, isFetching } = useLeaveRequests();
  const { data: leaveTypes = [] } = useLeaveTypes();

  const isLoading = employeesLoading || leavesLoading;

  // Calculate leave stats
  const pendingRequests = leaveRequests.filter((r: any) => r.status === "pending");
  const approvedRequests = leaveRequests.filter((r: any) => r.status === "approved");
  const rejectedRequests = leaveRequests.filter((r: any) => r.status === "rejected");

  // Group leave data by employee
  const employeeLeaveData = useMemo(() => {
    return employees.map((emp) => {
      const empRequests = leaveRequests.filter((r: any) => r.employee_id === emp.id);
      const approved = empRequests.filter((r: any) => r.status === "approved");
      const pending = empRequests.filter((r: any) => r.status === "pending");
      
      const usedDays = approved.reduce((sum: number, r: any) => sum + (r.days || 0), 0);
      const pendingDays = pending.reduce((sum: number, r: any) => sum + (r.days || 0), 0);
      const totalAllowed = leaveTypes.reduce((sum: number, lt: any) => sum + (lt.max_days || 0), 0);

      return {
        id: emp.id,
        employee_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
        employee_code: emp.employee_id || '-',
        department: emp.department?.name || '-',
        avatar_url: emp.avatar_url || null,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        total_leaves: totalAllowed,
        used_leaves: usedDays,
        pending_leaves: pendingDays,
        remaining_leaves: Math.max(0, totalAllowed - usedDays - pendingDays),
      };
    });
  }, [employees, leaveRequests, leaveTypes]);

  const filteredRecords = useMemo(() => {
    return employeeLeaveData.filter((record) => {
      const matchesSearch =
        record.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_code.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [employeeLeaveData, search]);

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

  const getYearOptions = () => {
    const options = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
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
      ? sortedRecords.filter(rec => selectedRows.has(rec.id))
      : sortedRecords;
    
    exportToCSV(dataToExport, columns, "leave_overview");
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
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={record.avatar_url || ""} />
            <AvatarFallback>
              {record.first_name?.[0] || ""}
              {record.last_name?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      );
    }

    if (column.id === 'used_leaves') {
      return <span className="text-success font-medium">{value}</span>;
    }

    if (column.id === 'pending_leaves') {
      return <span className="text-warning font-medium">{value}</span>;
    }

    if (column.id === 'remaining_leaves') {
      return <span className="text-info font-medium">{value}</span>;
    }

    if (column.id === 'id') {
      return value ? (
        <span className="font-mono text-xs">{value.substring(0, 8)}...</span>
      ) : "—";
    }

    return value ?? "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
          <h1 className="text-2xl font-semibold tracking-tight">Leave Overview</h1>
          <p className="text-muted-foreground">Track and manage employee leave balances</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{leaveRequests.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap" hideScrollbar={false}>
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filteredRecords.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No leave records found matching your criteria.
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
