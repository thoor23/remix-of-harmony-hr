import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Search, MoreHorizontal, Eye, Wrench, ArrowUp, ArrowDown } from "lucide-react";
import { useAssetMaintenance, useCreateMaintenance, useAssets } from "@/hooks/useAssets";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const typeColors: Record<string, string> = {
  repair: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  service: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  upgrade: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "asset", header: "Asset", accessor: (row: any) => row.asset?.name || "-", visible: true },
  { id: "type", header: "Type", accessor: "type", visible: true },
  { id: "description", header: "Description", accessor: "description", visible: true },
  { id: "vendor", header: "Vendor", accessor: "vendor", visible: true },
  { id: "scheduled_date", header: "Scheduled", accessor: "scheduled_date", visible: true },
  { id: "completed_date", header: "Completed", accessor: "completed_date", visible: true },
  { id: "cost", header: "Cost", accessor: "cost", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function AssetMaintenance() {
  const navigate = useNavigate();
  const { data: maintenanceRecords = [], isLoading, refetch } = useAssetMaintenance();
  const { data: assets = [] } = useAssets();
  const createMaintenance = useCreateMaintenance();

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ asset_id: "", type: "service", description: "", cost: "", vendor: "", scheduled_date: "", notes: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  const filteredRecords = useMemo(() => {
    let filtered = maintenanceRecords;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.asset?.name?.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query) || r.vendor?.toLowerCase().includes(query));
    }
    if (typeFilter !== "all") filtered = filtered.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
    return filtered;
  }, [maintenanceRecords, searchQuery, typeFilter, statusFilter]);

  const sortedRecords = useMemo(() => {
    if (!sortColumn) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      let aVal: any = sortColumn === "asset" ? a.asset?.name || "" : (a as any)[sortColumn] ?? "";
      let bVal: any = sortColumn === "asset" ? b.asset?.name || "" : (b as any)[sortColumn] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortColumn, sortDirection]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: sortedRecords, defaultPageSize: 10 });

  const resetForm = () => setFormData({ asset_id: "", type: "service", description: "", cost: "", vendor: "", scheduled_date: "", notes: "" });

  const handleSubmit = async () => {
    await createMaintenance.mutateAsync({
      asset_id: formData.asset_id,
      type: formData.type,
      description: formData.description || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      vendor: formData.vendor || undefined,
      scheduled_date: formData.scheduled_date || undefined,
      notes: formData.notes || undefined,
    });
    setShowDialog(false);
    resetForm();
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  const handleExport = () => exportToCSV(sortedRecords, columns, "asset-maintenance-export");
  const handleSelectAll = (checked: boolean) => setSelectedRows(checked ? new Set(paginatedData.map((r) => r.id)) : new Set());
  const handleSelectRow = (id: string, checked: boolean) => { const s = new Set(selectedRows); checked ? s.add(id) : s.delete(id); setSelectedRows(s); };
  const handleSort = (columnId: string) => { if (sortColumn === columnId) setSortDirection((p) => (p === "asc" ? "desc" : "asc")); else { setSortColumn(columnId); setSortDirection("asc"); } };

  const renderCellValue = (record: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(record) : record[column.accessor];
    switch (column.id) {
      case "type": return <Badge className={typeColors[value] || ""}>{value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      case "status": return <Badge className={statusColors[value] || ""}>{value === "in_progress" ? "In Progress" : value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      case "scheduled_date": case "completed_date": return value ? format(new Date(value), "dd MMM yyyy") : "-";
      case "cost": return `₹${(value || 0).toLocaleString()}`;
      case "description": return value ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : "-";
      default: return value || "-";
    }
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedRows.has(r.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Maintenance" description="Schedule and track asset maintenance">
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" />Schedule Maintenance</Button>
      </PageHeader>

      <Card>
        <DataTableToolbar columns={columns} onToggleColumn={handleToggleColumn} onExport={handleExport} onRefresh={() => refetch()} onAddRow={() => setShowDialog(true)} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} addRowLabel="Schedule Maintenance" />

        {showFilter && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search maintenance..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="repair">Repair</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
            </Select>
          </div>
        )}

        <div className="overflow-x-auto">
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
              : paginatedData.length === 0 ? (<TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground"><Wrench className="h-10 w-10 mb-2" /><p>No maintenance records found</p></div></TableCell></TableRow>)
              : paginatedData.map((record) => (
                <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/assets/${record.asset_id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows.has(record.id)} onCheckedChange={(checked) => handleSelectRow(record.id, !!checked)} /></TableCell>
                  {visibleColumns.map((column) => (<TableCell key={column.id}>{renderCellValue(record, column)}</TableCell>))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/admin/assets/${record.asset_id}`)}><Eye className="h-4 w-4 mr-2" />View Asset</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedRecords.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle><DialogDescription>Create a new maintenance record for an asset.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Asset *</Label><Select value={formData.asset_id} onValueChange={(value) => setFormData({ ...formData, asset_id: value })}><SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger><SelectContent>{assets.map((asset) => (<SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Type *</Label><Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="repair">Repair</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Maintenance description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Vendor</Label><Input placeholder="Service provider" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} /></div><div className="space-y-2"><Label>Estimated Cost (₹)</Label><Input type="number" placeholder="0" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>Scheduled Date</Label><DatePicker value={formData.scheduled_date} onChange={(value) => setFormData({ ...formData, scheduled_date: value })} placeholder="Select scheduled date" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={!formData.asset_id || createMaintenance.isPending}>{createMaintenance.isPending ? "Creating..." : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
