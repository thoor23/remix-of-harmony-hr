import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreHorizontal, Eye, UserCheck, ArrowUp, ArrowDown } from "lucide-react";
import { useAssetAssignments } from "@/hooks/useAssets";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { EmployeeCell } from "@/components/shared/EmployeeCell";

const getInitialColumns = (): ColumnDef[] => [
  { id: "asset", header: "Asset", accessor: (row: any) => row.asset?.name || "-", visible: true },
  { id: "employee", header: "Employee", accessor: (row: any) => row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "-", visible: true },
  { id: "location", header: "Location", accessor: (row: any) => row.location?.name || "-", visible: true },
  { id: "assigned_date", header: "Assigned Date", accessor: "assigned_date", visible: true },
  { id: "returned_date", header: "Returned Date", accessor: "returned_date", visible: true },
  { id: "condition_on_assign", header: "Condition (Assign)", accessor: "condition_on_assign", visible: true },
  { id: "condition_on_return", header: "Condition (Return)", accessor: "condition_on_return", visible: false },
  { id: "status", header: "Status", accessor: (row: any) => row.returned_date ? "Returned" : "Active", visible: true },
];

export default function AssetAssignments() {
  const navigate = useNavigate();
  const { data: assignments = [], isLoading, refetch } = useAssetAssignments();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => a.asset?.name?.toLowerCase().includes(query) || a.employee?.first_name?.toLowerCase().includes(query) || a.employee?.last_name?.toLowerCase().includes(query));
    }
    if (statusFilter === "active") filtered = filtered.filter((a) => !a.returned_date);
    if (statusFilter === "returned") filtered = filtered.filter((a) => a.returned_date);
    return filtered;
  }, [assignments, searchQuery, statusFilter]);

  const sortedAssignments = useMemo(() => {
    if (!sortColumn) return filteredAssignments;
    return [...filteredAssignments].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "asset": aVal = a.asset?.name || ""; bVal = b.asset?.name || ""; break;
        case "employee": aVal = a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : ""; bVal = b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : ""; break;
        case "location": aVal = a.location?.name || ""; bVal = b.location?.name || ""; break;
        case "status": aVal = a.returned_date ? "returned" : "active"; bVal = b.returned_date ? "returned" : "active"; break;
        default: aVal = (a as any)[sortColumn] ?? ""; bVal = (b as any)[sortColumn] ?? "";
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAssignments, sortColumn, sortDirection]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: sortedAssignments, defaultPageSize: 10 });

  const handleToggleColumn = (columnId: string, visible: boolean) => setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  const handleExport = () => exportToCSV(sortedAssignments, columns, "asset-assignments-export");
  const handleSelectAll = (checked: boolean) => setSelectedRows(checked ? new Set(paginatedData.map((a) => a.id)) : new Set());
  const handleSelectRow = (id: string, checked: boolean) => { const s = new Set(selectedRows); checked ? s.add(id) : s.delete(id); setSelectedRows(s); };
  const handleSort = (columnId: string) => { if (sortColumn === columnId) setSortDirection((p) => (p === "asc" ? "desc" : "asc")); else { setSortColumn(columnId); setSortDirection("asc"); } };

  const renderCellValue = (assignment: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(assignment) : assignment[column.accessor];
    switch (column.id) {
      case "employee":
        return (
          <EmployeeCell
            avatarUrl={assignment.employee?.avatar_url}
            firstName={assignment.employee?.first_name}
            lastName={assignment.employee?.last_name}
            employeeId={assignment.employee?.employee_id}
          />
        );
      case "status": return <Badge variant={assignment.returned_date ? "secondary" : "default"}>{value}</Badge>;
      case "assigned_date": case "returned_date": return value ? format(new Date(value), "dd MMM yyyy") : "-";
      case "condition_on_assign": case "condition_on_return": return value ? <span className="capitalize">{value}</span> : "-";
      default: return value || "-";
    }
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((a) => selectedRows.has(a.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Assignments" description="View all asset assignment history" />

      <Card>
        <DataTableToolbar columns={columns} onToggleColumn={handleToggleColumn} onExport={handleExport} onRefresh={() => refetch()} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} />

        {showFilter && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assignments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="returned">Returned</SelectItem></SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap" hideScrollbar={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Checkbox checked={allSelected} onCheckedChange={handleSelectAll} /></TableHead>
                {visibleColumns.map((column) => (
                  <TableHead key={column.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column.id)}>
                    <div className="flex items-center gap-1">{column.header}{sortColumn === column.id && (sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}</div>
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-4" /></TableCell>{visibleColumns.map((col) => (<TableCell key={col.id}><Skeleton className="h-4 w-24" /></TableCell>))}<TableCell><Skeleton className="h-4 w-8" /></TableCell></TableRow>))
              : paginatedData.length === 0 ? (<TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground"><UserCheck className="h-10 w-10 mb-2" /><p>No assignment history found</p></div></TableCell></TableRow>)
              : paginatedData.map((assignment) => (
                <TableRow key={assignment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/assets/${assignment.asset_id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows.has(assignment.id)} onCheckedChange={(checked) => handleSelectRow(assignment.id, !!checked)} /></TableCell>
                  {visibleColumns.map((column) => (<TableCell key={column.id}>{renderCellValue(assignment, column)}</TableCell>))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/admin/assets/${assignment.asset_id}`)}><Eye className="h-4 w-4 mr-2" />View Asset</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedAssignments.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Card>
    </PageContainer>
  );
}
