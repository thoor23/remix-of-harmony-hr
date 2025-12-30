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
import { Search, MoreHorizontal, Eye, ArrowRightLeft, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAssetTransfers } from "@/hooks/useAssets";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "asset", header: "Asset", accessor: (row: any) => row.asset?.name || "-", visible: true },
  { id: "from_location", header: "From Location", accessor: (row: any) => row.from_location?.name || "-", visible: true },
  { id: "to_location", header: "To Location", accessor: (row: any) => row.to_location?.name || "-", visible: true },
  { id: "transfer_date", header: "Transfer Date", accessor: "transfer_date", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "transferred_by", header: "Transferred By", accessor: (row: any) => row.transferred_by_employee ? `${row.transferred_by_employee.first_name} ${row.transferred_by_employee.last_name}` : "-", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function AssetTransfers() {
  const navigate = useNavigate();
  const { data: transfers = [], isLoading, refetch } = useAssetTransfers();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  const filteredTransfers = useMemo(() => {
    let filtered = transfers;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.asset?.name?.toLowerCase().includes(query) || t.from_location?.name?.toLowerCase().includes(query) || t.to_location?.name?.toLowerCase().includes(query) || t.reason?.toLowerCase().includes(query));
    }
    if (statusFilter !== "all") filtered = filtered.filter((t) => t.status === statusFilter);
    return filtered;
  }, [transfers, searchQuery, statusFilter]);

  const sortedTransfers = useMemo(() => {
    if (!sortColumn) return filteredTransfers;
    return [...filteredTransfers].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "asset": aVal = a.asset?.name || ""; bVal = b.asset?.name || ""; break;
        case "from_location": aVal = a.from_location?.name || ""; bVal = b.from_location?.name || ""; break;
        case "to_location": aVal = a.to_location?.name || ""; bVal = b.to_location?.name || ""; break;
        case "transferred_by": aVal = a.transferred_by_employee ? `${a.transferred_by_employee.first_name} ${a.transferred_by_employee.last_name}` : ""; bVal = b.transferred_by_employee ? `${b.transferred_by_employee.first_name} ${b.transferred_by_employee.last_name}` : ""; break;
        default: aVal = (a as any)[sortColumn] ?? ""; bVal = (b as any)[sortColumn] ?? "";
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTransfers, sortColumn, sortDirection]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: sortedTransfers, defaultPageSize: 10 });

  const handleToggleColumn = (columnId: string, visible: boolean) => setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  const handleExport = () => exportToCSV(sortedTransfers, columns, "asset-transfers-export");
  const handleSelectAll = (checked: boolean) => setSelectedRows(checked ? new Set(paginatedData.map((t) => t.id)) : new Set());
  const handleSelectRow = (id: string, checked: boolean) => { const s = new Set(selectedRows); checked ? s.add(id) : s.delete(id); setSelectedRows(s); };
  const handleSort = (columnId: string) => { if (sortColumn === columnId) setSortDirection((p) => (p === "asc" ? "desc" : "asc")); else { setSortColumn(columnId); setSortDirection("asc"); } };

  const renderCellValue = (transfer: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(transfer) : transfer[column.accessor];
    switch (column.id) {
      case "status": return <Badge className={statusColors[value] || ""}>{value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      case "transfer_date": return format(new Date(value), "dd MMM yyyy");
      case "reason": return value ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : "-";
      default: return value || "-";
    }
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((t) => selectedRows.has(t.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Transfers" description="View all asset transfer history between locations" />

      <Card>
        <DataTableToolbar columns={columns} onToggleColumn={handleToggleColumn} onExport={handleExport} onRefresh={() => refetch()} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} />

        {showFilter && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transfers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap">
          <Table className="w-max min-w-full">
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
              : paginatedData.length === 0 ? (<TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground"><ArrowRightLeft className="h-10 w-10 mb-2" /><p>No transfer history found</p></div></TableCell></TableRow>)
              : paginatedData.map((transfer) => (
                <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/assets/${transfer.asset_id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows.has(transfer.id)} onCheckedChange={(checked) => handleSelectRow(transfer.id, !!checked)} /></TableCell>
                  {visibleColumns.map((column) => (<TableCell key={column.id}>{renderCellValue(transfer, column)}</TableCell>))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/admin/assets/${transfer.asset_id}`)}><Eye className="h-4 w-4 mr-2" />View Asset</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedTransfers.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Card>
    </PageContainer>
  );
}
