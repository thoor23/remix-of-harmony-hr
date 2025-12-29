import { useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { ArrowRightLeft, Search, ArrowRight, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { useEmployeeTransfers, useCreateTransfer, useStores, CreateTransferInput, EmployeeTransfer } from "@/hooks/useStores";
import { useEmployees } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "employee", header: "Employee", accessor: "employee.first_name", visible: true },
  { id: "from_store", header: "From Store", accessor: "from_store.name", visible: true },
  { id: "to_store", header: "To Store", accessor: "to_store.name", visible: true },
  { id: "effective_date", header: "Effective Date", accessor: "effective_date", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "transfer_date", header: "Transfer Date", accessor: "transfer_date", visible: false },
];

export default function EmployeeTransfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<CreateTransferInput>({
    employee_id: "",
    to_store_id: "",
    effective_date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  const { data: transfers = [], isLoading, refetch, isFetching } = useEmployeeTransfers();
  const { data: stores = [] } = useStores();
  const { data: employees = [] } = useEmployees();
  const createTransfer = useCreateTransfer();

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const employeeName = `${t.employee?.first_name || ""} ${t.employee?.last_name || ""}`.toLowerCase();
      const fromStore = t.from_store?.name?.toLowerCase() || "";
      const toStore = t.to_store?.name?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return employeeName.includes(search) || fromStore.includes(search) || toStore.includes(search);
    });
  }, [transfers, searchTerm]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const sortedTransfers = useMemo(() => {
    if (!sortColumn) return filteredTransfers;
    
    return [...filteredTransfers].sort((a, b) => {
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
  }, [filteredTransfers, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedTransfers, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.to_store_id || !formData.effective_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTransfer.mutateAsync(formData);
      setIsDialogOpen(false);
      setFormData({
        employee_id: "",
        to_store_id: "",
        effective_date: new Date().toISOString().split("T")[0],
        reason: "",
        notes: "",
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getEmployeeCurrentStore = (employeeId: string) => {
    const employee = employees.find((e: any) => e.id === employeeId);
    if (employee?.primary_store_id) {
      return stores.find(s => s.id === employee.primary_store_id)?.name || "Unknown";
    }
    return "None";
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
      ? filteredTransfers.filter(t => selectedRows.has(t.id))
      : filteredTransfers;
    
    const exportData = dataToExport.map(t => ({
      employee_name: `${t.employee?.first_name || ""} ${t.employee?.last_name || ""}`,
      employee_id: t.employee?.employee_id || "",
      from_store: t.from_store?.name || "N/A",
      to_store: t.to_store?.name || "",
      effective_date: t.effective_date,
      reason: t.reason || "",
      status: t.status,
    }));
    
    exportToCSV(exportData, [
      { id: "employee_name", header: "Employee Name", accessor: "employee_name", visible: true },
      { id: "employee_id", header: "Employee ID", accessor: "employee_id", visible: true },
      { id: "from_store", header: "From Store", accessor: "from_store", visible: true },
      { id: "to_store", header: "To Store", accessor: "to_store", visible: true },
      { id: "effective_date", header: "Effective Date", accessor: "effective_date", visible: true },
      { id: "reason", header: "Reason", accessor: "reason", visible: true },
      { id: "status", header: "Status", accessor: "status", visible: true },
    ], "employee_transfers");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(t => t.id)));
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
    paginatedData.every(t => selectedRows.has(t.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (transfer: EmployeeTransfer, column: ColumnDef) => {
    if (column.id === 'employee') {
      return (
        <div>
          <div className="font-medium">
            {transfer.employee?.first_name} {transfer.employee?.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {transfer.employee?.employee_id}
          </div>
        </div>
      );
    }

    if (column.id === 'from_store') {
      if (transfer.from_store) {
        return (
          <div>
            <div>{transfer.from_store.name}</div>
            <div className="text-xs text-muted-foreground">
              {transfer.from_store.code}
            </div>
          </div>
        );
      }
      return <span className="text-muted-foreground">—</span>;
    }

    if (column.id === 'to_store') {
      return (
        <div>
          <div>{transfer.to_store?.name}</div>
          <div className="text-xs text-muted-foreground">
            {transfer.to_store?.code}
          </div>
        </div>
      );
    }

    if (column.id === 'effective_date' || column.id === 'transfer_date') {
      const value = getNestedValue(transfer, column.accessor as string);
      return value ? (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(value), "MMM d, yyyy")}
        </div>
      ) : "—";
    }

    if (column.id === 'status') {
      return (
        <Badge variant={transfer.status === "completed" ? "default" : "secondary"}>
          {transfer.status}
        </Badge>
      );
    }

    const value = getNestedValue(transfer, column.accessor as string);
    return value || <span className="text-muted-foreground">—</span>;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Employee Transfers" description="Manage employee transfers between stores" />
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
      <PageHeader title="Employee Transfers" description="Manage employee transfers between stores" />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => setIsDialogOpen(true)}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="New Transfer"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee or store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
                      {column.id === 'from_store' && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
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
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No transfers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(transfer.id)}
                        onCheckedChange={(checked) => handleSelectRow(transfer.id, !!checked)}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className="whitespace-nowrap">
                        {renderCellValue(transfer, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredTransfers.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Employee</DialogTitle>
            <DialogDescription>
              Move an employee from their current store to a new store.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e: any) => e.status === "active")
                      .map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} ({employee.employee_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.employee_id && (
                  <p className="text-xs text-muted-foreground">
                    Current store: {getEmployeeCurrentStore(formData.employee_id)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_store">Transfer To Store *</Label>
                <Select
                  value={formData.to_store_id}
                  onValueChange={(value) => setFormData({ ...formData, to_store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores
                      .filter((s) => s.is_active)
                      .map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name} ({store.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date *</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Promotion, Relocation, Business needs"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this transfer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTransfer.isPending}>
                {createTransfer.isPending ? "Transferring..." : "Transfer Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}