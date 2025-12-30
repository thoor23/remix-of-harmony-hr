import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { useDepartmentsData } from "@/hooks/useDepartments";
import {
  useDesignationsData,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
  Designation,
} from "@/hooks/useDesignations";

interface DesignationForm {
  name: string;
  code: string;
  level: number;
  department_id: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "name", header: "Name", accessor: "name", visible: true },
  { id: "code", header: "Code", accessor: "code", visible: true },
  { id: "level", header: "Level", accessor: "level", visible: true },
  { id: "department", header: "Department", accessor: (row: Designation) => row.department?.name || "All Departments", visible: true },
  { id: "department_id", header: "Department ID", accessor: "department_id", visible: false },
  { id: "created_at", header: "Created At", accessor: "created_at", visible: false },
  { id: "updated_at", header: "Updated At", accessor: "updated_at", visible: false },
];

export default function DesignationsPage() {
  const { data: departments = [] } = useDepartmentsData();
  const { data: designations = [], isLoading, refetch, isFetching } = useDesignationsData();
  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const deleteDesignation = useDeleteDesignation();

  const [desSearch, setDesSearch] = useState("");
  const [desDialogOpen, setDesDialogOpen] = useState(false);
  const [editingDes, setEditingDes] = useState<Designation | null>(null);
  const [desForm, setDesForm] = useState<DesignationForm>({ name: "", code: "", level: 1, department_id: "" });
  const [deleteDesDialog, setDeleteDesDialog] = useState<Designation | null>(null);

  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredDesignations = useMemo(() => 
    designations.filter(d => 
      d.name.toLowerCase().includes(desSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(desSearch.toLowerCase())
    ), [designations, desSearch]);

  const getColumnValue = (des: Designation, column: ColumnDef): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(des);
    }
    return (des as any)[column.accessor];
  };

  const sortedDesignations = useMemo(() => {
    if (!sortColumn) return filteredDesignations;
    
    return [...filteredDesignations].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      
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
  }, [filteredDesignations, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedDesignations, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const openDesDialog = (des?: Designation) => {
    if (des) {
      setEditingDes(des);
      setDesForm({ 
        name: des.name, 
        code: des.code, 
        level: des.level || 1, 
        department_id: des.department_id || "" 
      });
    } else {
      setEditingDes(null);
      setDesForm({ name: "", code: "", level: 1, department_id: "" });
    }
    setDesDialogOpen(true);
  };

  const saveDes = async () => {
    if (!desForm.name.trim() || !desForm.code.trim()) {
      return;
    }

    if (editingDes) {
      await updateDesignation.mutateAsync({
        id: editingDes.id,
        name: desForm.name,
        code: desForm.code.toUpperCase(),
        level: desForm.level,
        department_id: desForm.department_id || undefined,
      });
    } else {
      await createDesignation.mutateAsync({
        name: desForm.name,
        code: desForm.code.toUpperCase(),
        level: desForm.level,
        department_id: desForm.department_id || undefined,
      });
    }
    setDesDialogOpen(false);
  };

  const handleDeleteDes = async () => {
    if (deleteDesDialog) {
      await deleteDesignation.mutateAsync({ id: deleteDesDialog.id, name: deleteDesDialog.name });
      setDeleteDesDialog(null);
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
      ? filteredDesignations.filter(des => selectedRows.has(des.id))
      : filteredDesignations;
    
    exportToCSV(dataToExport, columns, "designations");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(des => des.id)));
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
    paginatedData.every(des => selectedRows.has(des.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (des: Designation, column: ColumnDef) => {
    const value = getColumnValue(des, column);

    if (column.id === 'code') {
      return <Badge variant="secondary" className="font-mono">{value}</Badge>;
    }

    if (column.id === 'level') {
      return <Badge variant="outline">Level {value || 1}</Badge>;
    }

    if (column.id === 'department') {
      return <span className="text-muted-foreground">{value}</span>;
    }

    if (column.id === 'id' || column.id === 'department_id') {
      return value ? <span className="font-mono text-xs">{value.substring(0, 8)}...</span> : "—";
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Designations" description="Manage job titles and position levels" />
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
        title="Designations"
        description="Manage job titles and position levels"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => openDesDialog()}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Add Designation"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designations..."
                value={desSearch}
                onChange={(e) => setDesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap">
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
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No designations found</h3>
                        <p className="text-muted-foreground text-sm">
                          {desSearch ? "Try adjusting your search" : "Get started by creating your first designation"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((des) => (
                  <TableRow key={des.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(des.id)}
                        onCheckedChange={(checked) => handleSelectRow(des.id, !!checked)}
                        aria-label={`Select ${des.name}`}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className="whitespace-nowrap">
                        {renderCellValue(des, column)}
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
                          <DropdownMenuItem onClick={() => openDesDialog(des)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDesDialog(des)}
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

      <Dialog open={desDialogOpen} onOpenChange={setDesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDes ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription>
              {editingDes ? "Update designation information" : "Create a new designation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Software Engineer"
                value={desForm.name}
                onChange={(e) => setDesForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., SWE"
                value={desForm.code}
                onChange={(e) => setDesForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={desForm.level}
                onChange={(e) => setDesForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">Higher level = more senior position</p>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={desForm.department_id || "_all"}
                onValueChange={(value) => setDesForm(prev => ({ ...prev, department_id: value === "_all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveDes}
              disabled={createDesignation.isPending || updateDesignation.isPending}
            >
              {editingDes ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDesDialog}
        onOpenChange={(open) => !open && setDeleteDesDialog(null)}
        title="Delete Designation"
        description="Are you sure you want to delete this designation? This action cannot be undone."
        itemName={deleteDesDialog?.name}
        onConfirm={handleDeleteDes}
      />
    </PageContainer>
  );
}
