import { useState } from 'react';
import { Plus, Edit, Trash2, Package, Laptop, Smartphone, Armchair, Car, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAssetCategories,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory,
} from '@/hooks/useAssets';
import type { AssetCategory } from '@/types/asset';

const iconOptions = [
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'Laptop', label: 'Laptop', icon: Laptop },
  { value: 'Smartphone', label: 'Smartphone', icon: Smartphone },
  { value: 'Armchair', label: 'Furniture', icon: Armchair },
  { value: 'Car', label: 'Vehicle', icon: Car },
  { value: 'Wrench', label: 'Equipment', icon: Wrench },
];

export default function AssetCategories() {
  const { data: categories, isLoading } = useAssetCategories();
  const createCategory = useCreateAssetCategory();
  const updateCategory = useUpdateAssetCategory();
  const deleteCategory = useDeleteAssetCategory();

  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AssetCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'Package',
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', icon: 'Package' });
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
      description: category.description || '',
      icon: category.icon || 'Package',
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

  const getIconComponent = (iconName: string | null) => {
    const option = iconOptions.find((opt) => opt.value === iconName);
    if (option) {
      const IconComponent = option.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <Package className="h-4 w-4" />;
  };

  return (
    <PageContainer>
      <PageHeader title="Asset Categories">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{getIconComponent(category.icon)}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono">{category.code}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingCategory(category);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details.'
                : 'Create a new asset category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Laptops"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                placeholder="LAPTOP"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Category description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                !formData.code ||
                createCategory.isPending ||
                updateCategory.isPending
              }
            >
              {createCategory.isPending || updateCategory.isPending
                ? 'Saving...'
                : editingCategory
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This will not delete
              assets in this category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
