import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Laptop,
  Smartphone,
  Armchair,
  Car,
  Wrench,
  Search,
  ArrowUp,
  ArrowDown,
  FolderOpen,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  useAssetCategories,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory,
} from "@/hooks/useAssets";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import type { AssetCategory } from "@/types/asset";

const iconOptions = [
  { value: "Package", label: "Package", icon: Package },
  { value: "Laptop", label: "Laptop", icon: Laptop },
  { value: "Smartphone", label: "Smartphone", icon: Smartphone },
  { value: "Armchair", label: "Furniture", icon: Armchair },
  { value: "Car", label: "Vehicle", icon: Car },
  { value: "Wrench", label: "Equipment", icon: Wrench },
];

const getInitialColumns = (): ColumnDef[] => [
  { id: "name", header: "Name", accessor: "name", visible: true },
  { id: "code", header: "Code", accessor: "code", visible: true },
  { id: "icon", header: "Icon", accessor: "icon", visible: true },
  { id: "description", header: "Description", accessor: "description", visible: true },
  { id: "is_active", header: "Status", accessor: "is_active", visible: true },
];

export default function AssetCategories() {
  const { data: categories = [], isLoading, refetch } = useAssetCategories();
  const createCategory = useCreateAssetCategory();
  const updateCategory = useUpdateAssetCategory();
  const deleteCategory = useDeleteAssetCategory();

  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AssetCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "", icon: "Package" });

  const [searchQuery, setSearchQuery] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name?.toLowerCase().includes(query) ||
        cat.code?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const sortedCategories = useMemo(() => {
    if (!sortColumn) return filteredCategories;
    return [...filteredCategories].sort((a, b) => {
      const aVal = String((a as any)[sortColumn] ?? "").toLowerCase();
      const bVal = String((b as any)[sortColumn] ?? "").toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCategories, sortColumn, sortDirection]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = usePagination({
    data: sortedCategories,
    defaultPageSize: 10,
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", icon: "Package" });
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (category: AssetCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
      icon: category.icon || "Package",
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
    } else {
      await createCategory.mutateAsync(formData);
    }
    setShowDialog(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deletingCategory) {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setShowDeleteDialog(false);
      setDeletingCategory(null);
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  };

  const handleExport = () => exportToCSV(sortedCategories, columns, "asset-categories-export");

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(paginatedData.map((c) => c.id)) : new Set());
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    checked ? newSelected.add(id) : newSelected.delete(id);
    setSelectedRows(newSelected);
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const getIconComponent = (iconName: string | null) => {
    const option = iconOptions.find((opt) => opt.value === iconName);
    if (option) {
      const IconComponent = option.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <Package className="h-4 w-4" />;
  };

  const renderCellValue = (category: any, column: ColumnDef) => {
    const value = typeof column.accessor === "function" ? column.accessor(category) : category[column.accessor];
    switch (column.id) {
      case "icon":
        return getIconComponent(value);
      case "is_active":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Active" : "Inactive"}
          </Badge>
        );
      default:
        return value || "-";
    }
  };

  const visibleColumns = columns.filter((col) => col.visible);
  const allSelected = paginatedData.length > 0 && paginatedData.every((c) => selectedRows.has(c.id));

  return (
    <PageContainer>
      <PageHeader title="Asset Categories" description="Organize assets into categories">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          onAddRow={openCreateDialog}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          addRowLabel="Add Category"
        />

        {showFilter && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
                {visibleColumns.map((column) => (
                  <TableHead key={column.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column.id)}>
                    <div className="flex items-center gap-1">
                      {column.header}
                      {sortColumn === column.id && (sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    {visibleColumns.map((col) => (<TableCell key={col.id}><Skeleton className="h-4 w-24" /></TableCell>))}
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FolderOpen className="h-10 w-10 mb-2" />
                      <p>No categories found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedRows.has(category.id)} onCheckedChange={(checked) => handleSelectRow(category.id, !!checked)} />
                    </TableCell>
                    {visibleColumns.map((column) => (<TableCell key={column.id}>{renderCellValue(category, column)}</TableCell>))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setDeletingCategory(category); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={sortedCategories.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Update the category details." : "Create a new asset category."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Laptops" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input placeholder="LAPTOP" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2"><opt.icon className="h-4 w-4" />{opt.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Category description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.code || createCategory.isPending || updateCategory.isPending}>
              {createCategory.isPending || updateCategory.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deletingCategory?.name}"? This will not delete assets in this category.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCategory.isPending}>{deleteCategory.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
