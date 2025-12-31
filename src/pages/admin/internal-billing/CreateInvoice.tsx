import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useCreateInvoice, useInvoiceCategories } from "@/hooks/useInternalInvoices";
import { useLocations } from "@/hooks/useLocations";
import { toast } from "sonner";
import type { CreateInvoiceItemInput } from "@/types/invoice";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { data: locations } = useLocations();
  const { data: categories } = useInvoiceCategories();
  const createInvoice = useCreateInvoice();

  const [formData, setFormData] = useState({
    from_location_id: "",
    to_location_id: "",
    invoice_type: "internal_service" as "expense_reimbursement" | "internal_service" | "goods_transfer",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    tax_rate: 0,
    notes: "",
    is_recurring: false,
    recurring_frequency: "" as "" | "weekly" | "monthly" | "quarterly" | "yearly",
  });

  const [items, setItems] = useState<CreateInvoiceItemInput[]>([
    { category_id: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { category_id: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreateInvoiceItemInput, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.from_location_id || !formData.to_location_id) {
      toast.error("Please select both From and To locations");
      return;
    }

    if (formData.from_location_id === formData.to_location_id) {
      toast.error("From and To locations must be different");
      return;
    }

    const validItems = items.filter((item) => item.description && item.quantity > 0 && item.unit_price > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid line item");
      return;
    }

    try {
      await createInvoice.mutateAsync({
        ...formData,
        recurring_frequency: formData.is_recurring ? (formData.recurring_frequency as any) : undefined,
        items: validItems,
      });
      navigate("/app/internal-billing/invoices");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Create Invoice" description="Create a new internal billing invoice">
        <Button variant="outline" onClick={() => navigate("/app/internal-billing/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Enter the basic invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Location *</Label>
                <Select
                  value={formData.from_location_id}
                  onValueChange={(v) => setFormData({ ...formData, from_location_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type === "store" ? "Store" : "Office"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Location *</Label>
                <Select
                  value={formData.to_location_id}
                  onValueChange={(v) => setFormData({ ...formData, to_location_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type === "store" ? "Store" : "Office"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Invoice Type *</Label>
                <Select
                  value={formData.invoice_type}
                  onValueChange={(v: any) => setFormData({ ...formData, invoice_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_service">Internal Service</SelectItem>
                    <SelectItem value="expense_reimbursement">Expense Reimbursement</SelectItem>
                    <SelectItem value="goods_transfer">Goods Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for this invoice"
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Recurring Invoice</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create invoices on a schedule
                  </p>
                </div>
                <Switch
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
              </div>
              {formData.is_recurring && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurring_frequency || "none"}
                    onValueChange={(v: any) => setFormData({ ...formData, recurring_frequency: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select frequency</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add items to this invoice</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[150px]">Unit Price</TableHead>
                  <TableHead className="w-[150px] text-right">Amount</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.category_id || "none"}
                        onValueChange={(v) => updateItem(index, "category_id", v === "none" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select category</SelectItem>
                          {categories?.filter(c => c.is_active).map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(item.quantity * item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-[300px] space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {formData.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax ({formData.tax_rate}%):</span>
                    <span>₹{calculateTax().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/app/internal-billing/invoices")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createInvoice.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
