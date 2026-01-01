import { useParams, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Send, Check, X, RefreshCw, Building2, MapPin, Calendar, Clock } from "lucide-react";
import { useInternalInvoice, useSendInvoice, usePayInvoice, useCancelInvoice } from "@/hooks/useInternalInvoices";
import { downloadInvoicePdf } from "@/lib/invoicePdfGenerator";
import { format } from "date-fns";
import { useState } from "react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft: { label: "Draft", variant: "secondary", color: "bg-muted" },
  sent: { label: "Sent", variant: "default", color: "bg-blue-100 dark:bg-blue-900" },
  paid: { label: "Paid", variant: "outline", color: "bg-green-100 dark:bg-green-900" },
  overdue: { label: "Overdue", variant: "destructive", color: "bg-red-100 dark:bg-red-900" },
  cancelled: { label: "Cancelled", variant: "secondary", color: "bg-muted" },
};

const invoiceTypeLabels: Record<string, string> = {
  expense_reimbursement: "Expense Reimbursement",
  internal_service: "Internal Service",
  goods_transfer: "Goods Transfer",
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInternalInvoice(id);
  
  const sendInvoice = useSendInvoice();
  const payInvoice = usePayInvoice();
  const cancelInvoice = useCancelInvoice();

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  const handleDownload = () => {
    if (invoice) {
      downloadInvoicePdf(invoice as any);
    }
  };

  const handlePay = async () => {
    if (!id) return;
    await payInvoice.mutateAsync({ id, payment_reference: paymentReference });
    setIsPayDialogOpen(false);
    setPaymentReference("");
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading invoice...</div>
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-muted-foreground mb-4">Invoice not found</div>
          <Button onClick={() => navigate("/app/internal-billing/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={`Invoice ${invoice.invoice_number}`} description="View invoice details">
        <Button variant="outline" onClick={() => navigate("/app/internal-billing/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {invoice.status === "draft" && (
          <Button onClick={() => sendInvoice.mutate(invoice.id)}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        )}
        {invoice.status === "sent" && (
          <Button onClick={() => setIsPayDialogOpen(true)}>
            <Check className="h-4 w-4 mr-2" />
            Mark as Paid
          </Button>
        )}
        {(invoice.status === "draft" || invoice.status === "sent") && (
          <Button variant="destructive" onClick={() => cancelInvoice.mutate(invoice.id)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
                  <Badge variant={statusConfig[invoice.status]?.variant || "secondary"} className="mt-2">
                    {statusConfig[invoice.status]?.label || invoice.status}
                  </Badge>
                  {invoice.is_recurring && (
                    <Badge variant="outline" className="ml-2">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {invoice.recurring_frequency}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-base">
                  {invoiceTypeLabels[invoice.invoice_type]}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* From Location */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    FROM
                  </div>
                  <div className="font-semibold text-lg">{invoice.from_location?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {invoice.from_location?.type === "store" ? "Store" : "Office"} • {invoice.from_location?.code}
                  </div>
                </div>

                {/* To Location */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    TO
                  </div>
                  <div className="font-semibold text-lg">{invoice.to_location?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {invoice.to_location?.type === "store" ? "Store" : "Office"} • {invoice.to_location?.code}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.category?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ₹{Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="w-[300px] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{Number(invoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax ({invoice.tax_rate}%):</span>
                      <span>₹{Number(invoice.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₹{Number(invoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Invoice Date</div>
                  <div className="font-medium">{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Due Date</div>
                  <div className="font-medium">{format(new Date(invoice.due_date), "dd MMM yyyy")}</div>
                </div>
              </div>
              {invoice.paid_at && (
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Paid On</div>
                    <div className="font-medium">{format(new Date(invoice.paid_at), "dd MMM yyyy")}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          {invoice.status === "paid" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">Paid</Badge>
                  </div>
                  {invoice.payment_reference && (
                    <div>
                      <div className="text-sm text-muted-foreground">Reference</div>
                      <div className="font-medium">{invoice.payment_reference}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Created By */}
          {invoice.created_by_employee && (
            <Card>
              <CardHeader>
                <CardTitle>Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">
                  {invoice.created_by_employee.first_name} {invoice.created_by_employee.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {invoice.created_by_employee.employee_id}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {format(new Date(invoice.created_at), "dd MMM yyyy 'at' HH:mm")}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment for invoice {invoice.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold">
                ₹{Number(invoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference (Optional)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Transaction ID, Check number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={payInvoice.isPending}>
              {payInvoice.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
