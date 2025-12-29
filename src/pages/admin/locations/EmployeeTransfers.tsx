import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { ArrowRightLeft, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useEmployeeTransfers, useCreateTransfer, useAllLocations, CreateTransferInput, EmployeeTransfer } from "@/hooks/useLocations";
import { useEmployees } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "employee", header: "Employee", accessor: "employee.first_name", visible: true },
  { id: "from_store", header: "From Location", accessor: "from_store.name", visible: true },
  { id: "to_store", header: "To Location", accessor: "to_store.name", visible: true },
  { id: "effective_date", header: "Effective Date", accessor: "effective_date", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function EmployeeTransfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [formData, setFormData] = useState<CreateTransferInput>({ employee_id: "", to_store_id: "", effective_date: new Date().toISOString().split("T")[0], reason: "", notes: "" });

  const { data: transfers = [], isLoading, refetch, isFetching } = useEmployeeTransfers();
  const { data: locations = [] } = useAllLocations();
  const { data: employees = [] } = useEmployees();
  const createTransfer = useCreateTransfer();

  const filteredTransfers = useMemo(() => transfers.filter((t) => {
    const name = `${t.employee?.first_name || ""} ${t.employee?.last_name || ""}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || t.from_store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.to_store?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  }), [transfers, searchTerm]);

  const { currentPage, pageSize, totalPages, totalItems, paginatedData, setCurrentPage, setPageSize } = usePagination({ data: filteredTransfers, defaultPageSize: 10 });
  const visibleColumns = useMemo(() => columns.filter(col => col.visible !== false), [columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.to_store_id) { toast.error("Fill required fields"); return; }
    await createTransfer.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({ employee_id: "", to_store_id: "", effective_date: new Date().toISOString().split("T")[0], reason: "", notes: "" });
  };

  const getEmployeeCurrentLocation = (employeeId: string) => {
    const emp = employees.find((e: any) => e.id === employeeId);
    return emp?.primary_store_id ? locations.find(l => l.id === emp.primary_store_id)?.name || "Unknown" : "None";
  };

  if (isLoading) return <PageContainer><PageHeader title="Employee Transfers" /><Card><div className="p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}</div></Card></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Employee Transfers" description="Manage employee transfers between locations" />
      <Card>
        <DataTableToolbar columns={columns} onToggleColumn={(id, v) => setColumns(p => p.map(c => c.id === id ? {...c, visible: v} : c))} onExport={() => { exportToCSV(filteredTransfers.map(t => ({ employee: `${t.employee?.first_name} ${t.employee?.last_name}`, from: t.from_store?.name, to: t.to_store?.name, date: t.effective_date, status: t.status })), columns, "transfers"); toast.success("Exported"); }} onRefresh={() => { refetch(); toast.success("Refreshed"); }} onAddRow={() => setIsDialogOpen(true)} onToggleFilter={() => setShowFilter(!showFilter)} showFilter={showFilter} isRefreshing={isFetching} addRowLabel="New Transfer" />
        {showFilter && <div className="p-4 border-b bg-muted/30"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div></div>}
        <Table>
          <TableHeader><TableRow><TableHead className="w-12"><Checkbox /></TableHead>{visibleColumns.map(c => <TableHead key={c.id}>{c.header}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? <TableRow><TableCell colSpan={visibleColumns.length + 1} className="h-48 text-center"><ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p>No transfers found</p></TableCell></TableRow> : paginatedData.map((t) => (
              <TableRow key={t.id}>
                <TableCell><Checkbox /></TableCell>
                {visibleColumns.map(col => <TableCell key={col.id}>
                  {col.id === 'employee' ? <div><div className="font-medium">{t.employee?.first_name} {t.employee?.last_name}</div><div className="text-xs text-muted-foreground">{t.employee?.employee_id}</div></div> :
                   col.id === 'from_store' ? (t.from_store?.name || "—") :
                   col.id === 'to_store' ? t.to_store?.name :
                   col.id === 'effective_date' ? <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(t.effective_date), "MMM d, yyyy")}</div> :
                   col.id === 'status' ? <Badge>{t.status}</Badge> : "—"}
                </TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredTransfers.length > 0 && <TablePagination currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />}
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Transfer Employee</DialogTitle><DialogDescription>Move an employee to a new location.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Employee *</Label><Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{employees.filter((e: any) => e.status === "active").map((e: any) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent></Select>{formData.employee_id && <p className="text-xs text-muted-foreground">Current: {getEmployeeCurrentLocation(formData.employee_id)}</p>}</div>
            <div className="space-y-2"><Label>Transfer To *</Label><Select value={formData.to_store_id} onValueChange={(v) => setFormData({ ...formData, to_store_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{locations.filter(l => l.is_active).map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.type})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Effective Date *</Label><Input type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Reason</Label><Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={createTransfer.isPending}>{createTransfer.isPending ? "Transferring..." : "Transfer"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
