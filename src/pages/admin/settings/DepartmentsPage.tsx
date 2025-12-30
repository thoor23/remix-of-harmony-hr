import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import {
  useDepartmentsData,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  Department,
} from "@/hooks/useDepartments";

interface DepartmentForm {
  name: string;
  code: string;
  description: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "name", header: "Name", accessor: "name", visible: true },
  { id: "code", header: "Code", accessor: "code", visible: true },
  { id: "employee_count", header: "Employees", accessor: "employee_count", visible: true },
  { id: "description", header: "Description", accessor: "description", visible: true },
  { id: "created_at", header: "Created At", accessor: "created_at", visible: false },
  { id: "updated_at", header: "Updated At", accessor: "updated_at", visible: false },
];

export default function DepartmentsPage() {
  const { data: departments = [], isLoading, refetch, isFetching } = useDepartmentsData();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [deptSearch, setDeptSearch] = useState("");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<DepartmentForm>({ name: "", code: "", description: "" });
  const [deleteDeptDialog, setDeleteDeptDialog] = useState<Department | null>(null);
  
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredDepartments = useMemo(() => 
    departments.filter(d => 
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase())
    ), [departments, deptSearch]);

  const sortedDepartments = useMemo(() => {
    if (!sortColumn) return filteredDepartments;
    
    return [...filteredDepartments].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = (a as any)[column.accessor as string];
      const bValue = (b as any)[column.accessor as string];
      
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
  }, [filteredDepartments, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedDepartments, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const openDeptDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code, description: dept.description || "" });
    } else {
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "" });
    }
    setDeptDialogOpen(true);
  };

  const saveDept = async () => {
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      return;
    }

    if (editingDept) {
      await updateDepartment.mutateAsync({
        id: editingDept.id,
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
        description: deptForm.description,
      });
    } else {
      await createDepartment.mutateAsync({
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
        description: deptForm.description,
      });
    }
    setDeptDialogOpen(false);
  };

  const handleDeleteDept = async () => {
    if (deleteDeptDialog) {
      await deleteDepartment.mutateAsync({ id: deleteDeptDialog.id, name: deleteDeptDialog.name });
      setDeleteDeptDialog(null);
    }
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
      ? filteredDepartments.filter(dept => selectedRows.has(dept.id))
      : filteredDepartments;
    
    exportToCSV(dataToExport, columns, "departments");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(dept => dept.id)));
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
    paginatedData.every(dept => selectedRows.has(dept.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (dept: Department, column: ColumnDef) => {
    const value = (dept as any)[column.accessor as string];

    if (column.id === 'code') {
      return <Badge variant="secondary" className="font-mono">{value}</Badge>;
    }

    if (column.id === 'employee_count') {
      return (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {value || 0}
        </div>
      );
    }

    if (column.id === 'description') {
      return <span className="text-muted-foreground max-w-[200px] truncate block">{value || "—"}</span>;
    }

    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Departments" description="Manage organization departments" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        description="Manage organization departments"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => openDeptDialog()}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Add Department"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap" hideScrollbar={false}>
          <Table className="w-max min-w-full">
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
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No departments found</h3>
                        <p className="text-muted-foreground text-sm">
                          {deptSearch ? "Try adjusting your search" : "Get started by creating your first department"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(dept.id)}
                        onCheckedChange={(checked) => handleSelectRow(dept.id, !!checked)}
                        aria-label={`Select ${dept.name}`}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className="whitespace-nowrap">
                        {renderCellValue(dept, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDeptDialog(dept)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDeptDialog(dept)}
                            disabled={(dept.employee_count || 0) > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department information" : "Create a new department"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Engineering"
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., ENG"
                value={deptForm.code}
                onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the department"
                value={deptForm.description}
                onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveDept} 
              disabled={createDepartment.isPending || updateDepartment.isPending}
            >
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDeptDialog}
        onOpenChange={(open) => !open && setDeleteDeptDialog(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        itemName={deleteDeptDialog?.name}
        warningText={deleteDeptDialog?.employee_count ? `${deleteDeptDialog.employee_count} employees are assigned to this department.` : undefined}
        onConfirm={handleDeleteDept}
      />
    </PageContainer>
  );
}
