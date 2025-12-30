import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Clock, CheckCircle, XCircle, AlertCircle, Timer, ArrowUpDown } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyAttendance } from "@/hooks/useAttendance";
import { useAllLocations } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";

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

export default function EmployeeAttendance() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: myRecords = [], isLoading: recordsLoading, refetch } = useMyAttendance(employee?.id);
  const { data: locations = [] } = useAllLocations();

  // Get store name from location id
  const getStoreName = (storeId: string | null) => {
    if (!storeId) return employee?.primary_store?.name || "-";
    const location = locations.find((l) => l.id === storeId);
    return location?.name || "-";
  };

  // Filter records for selected month
  const filteredRecords = useMemo(() => {
    return myRecords.filter((r) => r.date.startsWith(selectedMonth));
  }, [myRecords, selectedMonth]);

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

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
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
      ? sortedRecords.filter((r) => selectedRows.has(r.id))
      : sortedRecords;
    
    const exportData = dataToExport.map((r) => ({
      ...r,
      department: employee?.department?.name || "-",
      store: getStoreName(r.store_id),
    }));
    exportToCSV(exportData, columns, `attendance-${selectedMonth}`);
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

      {/* Month Selector */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          isRefreshing={recordsLoading}
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
                  No attendance records for this month
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
