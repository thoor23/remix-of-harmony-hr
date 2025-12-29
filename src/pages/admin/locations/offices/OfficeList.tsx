import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Building2, Eye, Edit, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { useOffices, useDeleteLocation, Location } from "@/hooks/useLocations";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "name", header: "Office Name", accessor: "name", visible: true },
  { id: "code", header: "Code", accessor: "code", visible: true },
  { id: "address_city", header: "City", accessor: "address_city", visible: true },
  { id: "employee_count", header: "Employees", accessor: "employee_count", visible: true },
  { id: "is_active", header: "Status", accessor: "is_active", visible: true },
];

export default function OfficeList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteOffice, setDeleteOffice] = useState<Location | null>(null);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { data: offices = [], isLoading, refetch, isFetching } = useOffices();
  const deleteMutation = useDeleteLocation();

  const filteredOffices = useMemo(() => offices.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.code.toLowerCase().includes(searchTerm.toLowerCase())
  ), [offices, searchTerm]);

  const { currentPage, pageSize, totalPages, totalItems, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: filteredOffices, defaultPageSize: 10 });
  const visibleColumns = useMemo(() => columns.filter(col => col.visible !== false), [columns]);

  const handleDelete = async () => { if (deleteOffice) { await deleteMutation.mutateAsync(deleteOffice.id); setDeleteOffice(null); } };

  if (isLoading) {
    return <PageContainer><PageHeader title="Offices" description="Manage office locations" /><Card><div className="p-4 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></Card></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="Offices" description="Manage office locations" />
      <Card>
        <DataTableToolbar columns={columns} onToggleColumn={(id, v) => setColumns(p => p.map(c => c.id === id ? {...c, visible: v} : c))} onExport={() => { exportToCSV(filteredOffices, columns, "offices"); toast.success("Exported"); }} onRefresh={() => { refetch(); toast.success("Refreshed"); }} onAddRow={() => navigate('/admin/locations/offices/add')} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} isRefreshing={isFetching} addRowLabel="Add Office" />
        {showFilter && <div className="p-4 border-b bg-muted/30"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search offices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></div>}
        <Table>
          <TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={paginatedData.length > 0 && paginatedData.every(o => selectedRows.has(o.id))} onCheckedChange={(c) => setSelectedRows(c ? new Set(paginatedData.map(o => o.id)) : new Set())} /></TableHead>{visibleColumns.map(c => <TableHead key={c.id}>{c.header}</TableHead>)}<TableHead className="w-12"></TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? <TableRow><TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center"><Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p>No offices found</p></TableCell></TableRow> : paginatedData.map((office) => (
              <TableRow key={office.id}>
                <TableCell><Checkbox checked={selectedRows.has(office.id)} onCheckedChange={(c) => { const n = new Set(selectedRows); c ? n.add(office.id) : n.delete(office.id); setSelectedRows(n); }} /></TableCell>
                {visibleColumns.map(col => <TableCell key={col.id}>{col.id === 'is_active' ? <Badge variant={office.is_active ? "default" : "secondary"}>{office.is_active ? "Active" : "Inactive"}</Badge> : (office as any)[col.accessor as string] || "—"}</TableCell>)}
                <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to={`/admin/locations/offices/${office.id}`}><Eye className="mr-2 h-4 w-4" />View</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to={`/admin/locations/offices/${office.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteOffice(office)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredOffices.length > 0 && <TablePagination currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />}
      </Card>
      <AlertDialog open={!!deleteOffice} onOpenChange={() => setDeleteOffice(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Office</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deleteOffice?.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </PageContainer>
  );
}
