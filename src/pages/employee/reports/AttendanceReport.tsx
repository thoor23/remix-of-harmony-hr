import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { CalendarDays, Clock, CheckCircle, TrendingUp, ArrowUpDown } from "lucide-react";
import { useMyAttendance } from "@/hooks/useAttendance";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

// Helper to safely format date
const safeFormatDate = (dateStr: string | null | undefined, formatStr: string): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch {
    return "-";
  }
};

// Helper to format time string (HH:mm:ss)
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "-";
  return timeStr.slice(0, 5);
};

const defaultColumns: ColumnDef[] = [
  { id: "date", header: "Date", accessor: "date", visible: true },
  { id: "check_in", header: "Check In", accessor: "check_in", visible: true },
  { id: "check_out", header: "Check Out", accessor: "check_out", visible: true },
  { id: "work_hours", header: "Work Hours", accessor: "work_hours", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function EmployeeAttendanceReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: attendanceRecords = [], isLoading, refetch } = useMyAttendance();

  // Filter records by date range
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      const recordDate = new Date(r.date);
      if (dateRange?.from && recordDate < dateRange.from) return false;
      if (dateRange?.to && recordDate > dateRange.to) return false;
      return true;
    });
  }, [attendanceRecords, dateRange]);

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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === "present").length;
    const late = filteredRecords.filter(r => r.status === "late").length;
    const absent = filteredRecords.filter(r => r.status === "absent").length;
    const onLeave = filteredRecords.filter(r => r.status === "on_leave" || r.status === "on-leave").length;
    const avgHours = total > 0 
      ? (filteredRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0) / total).toFixed(1)
      : "0";
    const onTimeRate = total > 0 ? Math.round(((present) / total) * 100) : 0;

    return { total, present, late, absent, onLeave, avgHours, onTimeRate };
  }, [filteredRecords]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: "Present", value: stats.present, fill: "hsl(var(--chart-1))" },
    { name: "Late", value: stats.late, fill: "hsl(var(--chart-2))" },
    { name: "Absent", value: stats.absent, fill: "hsl(var(--chart-3))" },
    { name: "On Leave", value: stats.onLeave, fill: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0), [stats]);

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
      date: safeFormatDate(r.date, "dd MMM yyyy"),
      check_in: formatTime(r.check_in),
      check_out: formatTime(r.check_out),
      work_hours: r.work_hours?.toFixed(1) || "-",
      status: r.status,
    }));
    exportToCSV(exportData, columns, "my-attendance-report");
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

  const exportData = {
    headers: ["Date", "Check In", "Check Out", "Hours", "Status"],
    rows: sortedRecords.map(r => [
      safeFormatDate(r.date, "dd MMM yyyy"),
      formatTime(r.check_in),
      formatTime(r.check_out),
      r.work_hours?.toFixed(1) || "-",
      r.status,
    ]),
    filename: "my-attendance-report",
  };

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader
        title="My Attendance Report"
        description="Track your attendance patterns and work hours"
      />
      
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Attendance Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Days"
          value={stats.total.toString()}
          icon={CalendarDays}
        />
        <StatCard
          title="Days Present"
          value={stats.present.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="On-Time Rate"
          value={`${stats.onTimeRate}%`}
          icon={Clock}
        />
        <StatCard
          title="Avg. Work Hours"
          value={`${stats.avgHours} hrs`}
          icon={TrendingUp}
        />
      </div>

      {/* Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Status Distribution"
          data={statusDistribution}
          showLegend
        />
      </div>

      {/* Date Range Filter */}
      <ReportFilters
        onDateRangeChange={setDateRange}
        showDepartmentFilter={false}
        showStoreFilter={false}
        className="mb-4"
      />

      {/* Attendance Records Table */}
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
                      {col.id === "date" ? (
                        safeFormatDate(record.date, "dd MMM yyyy")
                      ) : col.id === "check_in" ? (
                        formatTime(record.check_in)
                      ) : col.id === "check_out" ? (
                        formatTime(record.check_out)
                      ) : col.id === "work_hours" ? (
                        record.work_hours ? `${record.work_hours.toFixed(1)}h` : "-"
                      ) : col.id === "status" ? (
                        <StatusBadge status={record.status as any} />
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
                  No attendance records found for the selected date range
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
