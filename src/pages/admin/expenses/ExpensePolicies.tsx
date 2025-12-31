import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { 
  Plus, Pencil, Trash2, Gavel, DollarSign, UserCheck, Zap, RefreshCw
} from "lucide-react";
import { 
  useExpensePolicies, 
  useCreateExpensePolicy, 
  useUpdateExpensePolicy, 
  useDeleteExpensePolicy,
  ExpensePolicy 
} from "@/hooks/useExpenses";
import { toast } from "sonner";

const defaultFormData = {
  name: "",
  max_monthly_limit: 0,
  requires_manager_approval: true,
  auto_approve_below: 0,
  is_active: true,
};

export default function ExpensePolicies() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ExpensePolicy | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: policies = [], isLoading, refetch, isFetching } = useExpensePolicies();
  const createPolicy = useCreateExpensePolicy();
  const updatePolicy = useUpdateExpensePolicy();
  const deletePolicy = useDeleteExpensePolicy();

  const handleAddNew = () => {
    setEditingPolicy(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleEdit = (policy: ExpensePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      max_monthly_limit: policy.max_monthly_limit,
      requires_manager_approval: policy.requires_manager_approval,
      auto_approve_below: policy.auto_approve_below,
      is_active: policy.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (policy: ExpensePolicy) => {
    setEditingPolicy(policy);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    try {
      if (editingPolicy) {
        await updatePolicy.mutateAsync({
          id: editingPolicy.id,
          ...formData,
        });
        toast.success("Policy updated successfully");
      } else {
        await createPolicy.mutateAsync(formData);
        toast.success("Policy created successfully");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save policy");
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingPolicy) return;
    
    try {
      await deletePolicy.mutateAsync(editingPolicy.id);
      toast.success("Policy deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete policy");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expense Policies</h1>
          <p className="text-muted-foreground">Configure expense approval rules and limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Gavel className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">No policies configured</h3>
                <p className="text-muted-foreground text-sm">
                  Create expense policies to control approval workflows
                </p>
              </div>
              <Button onClick={handleAddNew} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Create First Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      {policy.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(policy)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(policy)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Limit</p>
                      <p className="font-semibold">{formatCurrency(policy.max_monthly_limit)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Auto-approve below</p>
                      <p className="font-semibold">{formatCurrency(policy.auto_approve_below)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manager Approval</p>
                    <p className="font-semibold">
                      {policy.requires_manager_approval ? "Required" : "Not Required"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit Policy" : "Add New Policy"}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy 
                ? "Update the expense policy configuration" 
                : "Create a new expense approval policy"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Default Policy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_monthly_limit">Maximum Monthly Limit (₹)</Label>
              <Input
                id="max_monthly_limit"
                type="number"
                placeholder="e.g., 100000"
                value={formData.max_monthly_limit}
                onChange={(e) => setFormData({ ...formData, max_monthly_limit: Number(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Maximum amount an employee can claim per month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_approve_below">Auto-approve Below (₹)</Label>
              <Input
                id="auto_approve_below"
                type="number"
                placeholder="e.g., 500"
                value={formData.auto_approve_below}
                onChange={(e) => setFormData({ ...formData, auto_approve_below: Number(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Expenses below this amount will be automatically approved (set 0 to disable)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Manager Approval Required</Label>
                <p className="text-sm text-muted-foreground">
                  Expenses require manager approval before processing
                </p>
              </div>
              <Switch
                checked={formData.requires_manager_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_manager_approval: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  This policy is currently in effect
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPolicy.isPending || updatePolicy.isPending}
            >
              {createPolicy.isPending || updatePolicy.isPending 
                ? "Saving..." 
                : editingPolicy ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Policy"
        description={`Are you sure you want to delete "${editingPolicy?.name}"? This action cannot be undone.`}
        isLoading={deletePolicy.isPending}
      />
    </PageContainer>
  );
}
