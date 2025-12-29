import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
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
import { ArrowRightLeft, Plus, Search, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useEmployeeTransfers, useCreateTransfer, useStores, CreateTransferInput } from "@/hooks/useStores";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";

export default function EmployeeTransfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTransferInput>({
    employee_id: "",
    to_store_id: "",
    effective_date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  const { data: transfers = [], isLoading } = useEmployeeTransfers();
  const { data: stores = [] } = useStores();
  const { data: employees = [] } = useEmployees();
  const createTransfer = useCreateTransfer();

  const filteredTransfers = transfers.filter((t) => {
    const employeeName = `${t.employee?.first_name || ""} ${t.employee?.last_name || ""}`.toLowerCase();
    const fromStore = t.from_store?.name?.toLowerCase() || "";
    const toStore = t.to_store?.name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return employeeName.includes(search) || fromStore.includes(search) || toStore.includes(search);
  });

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

  // Get employee's current store for display
  const getEmployeeCurrentStore = (employeeId: string) => {
    const employee = employees.find((e: any) => e.id === employeeId);
    if (employee?.primary_store_id) {
      return stores.find(s => s.id === employee.primary_store_id)?.name || "Unknown";
    }
    return "None";
  };

  return (
    <PageContainer>
      <PageHeader
        title="Employee Transfers"
        description="Manage employee transfers between stores"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </DialogTrigger>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transfers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>From Store</TableHead>
                  <TableHead></TableHead>
                  <TableHead>To Store</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.employee?.first_name} {transfer.employee?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transfer.employee?.employee_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.from_store ? (
                        <div>
                          <div>{transfer.from_store.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {transfer.from_store.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{transfer.to_store?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {transfer.to_store?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(transfer.effective_date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.reason || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transfer.status === "completed" ? "default" : "secondary"}
                      >
                        {transfer.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
