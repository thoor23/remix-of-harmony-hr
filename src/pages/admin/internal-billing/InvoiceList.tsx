import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, FileText, Search, MoreHorizontal, Eye, Send, Check, X, Download, RefreshCw, DollarSign, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { useInternalInvoices, useInvoiceStats, useSendInvoice, usePayInvoice, useCancelInvoice, useProcessRecurringInvoices } from "@/hooks/useInternalInvoices";
import { useLocations } from "@/hooks/useLocations";
import { downloadInvoicePdf } from "@/lib/invoicePdfGenerator";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const invoiceTypeLabels: Record<string, string> = {
  expense_reimbursement: "Expense Reimbursement",
  internal_service: "Internal Service",
  goods_transfer: "Goods Transfer",
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    from_location_id: "",
    to_location_id: "",
    invoice_type: "",
    search: "",
  });

  const { data: invoices, isLoading } = useInternalInvoices({
    status: filters.status || undefined,
    from_location_id: filters.from_location_id || undefined,
    to_location_id: filters.to_location_id || undefined,
    invoice_type: filters.invoice_type || undefined,
  });
  const { data: stats } = useInvoiceStats();
  const { data: locations } = useLocations();

  const sendInvoice = useSendInvoice();
  const payInvoice = usePayInvoice();
  const cancelInvoice = useCancelInvoice();
  const processRecurring = useProcessRecurringInvoices();

  const filteredInvoices = invoices?.filter((invoice) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.from_location?.name.toLowerCase().includes(searchLower) ||
      invoice.to_location?.name.toLowerCase().includes(searchLower)
    );
  });

  const handleDownloadPdf = async (invoice: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-internal-invoices/${invoice.id}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    const fullInvoice = await response.json();
    downloadInvoicePdf(fullInvoice);
  };

  return (
    <PageContainer>
      <PageHeader title="Internal Billing" description="Manage internal invoices between locations">
        <Button variant="outline" onClick={() => processRecurring.mutate()} disabled={processRecurring.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${processRecurring.isPending ? 'animate-spin' : ''}`} />
          Process Recurring
        </Button>
        <Button onClick={() => navigate("/app/internal-billing/invoices/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Invoices"
          value={stats?.total_invoices || 0}
          icon={FileCheck}
        />
        <StatCard
          title="Pending Amount"
          value={`₹${(stats?.pending_amount || 0).toLocaleString('en-IN')}`}
          icon={Clock}
        />
        <StatCard
          title="Paid This Month"
          value={`₹${(stats?.paid_this_month || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue_count || 0}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and manage all internal invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.invoice_type} onValueChange={(v) => setFilters({ ...filters, invoice_type: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Invoice Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="expense_reimbursement">Expense Reimbursement</SelectItem>
                <SelectItem value="internal_service">Internal Service</SelectItem>
                <SelectItem value="goods_transfer">Goods Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.from_location_id} onValueChange={(v) => setFilters({ ...filters, from_location_id: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="From Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoiceTypeLabels[invoice.invoice_type]}</Badge>
                      </TableCell>
                      <TableCell>{invoice.from_location?.name || "-"}</TableCell>
                      <TableCell>{invoice.to_location?.name || "-"}</TableCell>
                      <TableCell>{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[invoice.status]?.variant || "secondary"}>
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </Badge>
                        {invoice.is_recurring && (
                          <Badge variant="outline" className="ml-1">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/internal-billing/invoices/${invoice.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.status === "draft" && (
                              <DropdownMenuItem onClick={() => sendInvoice.mutate(invoice.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            {invoice.status === "sent" && (
                              <DropdownMenuItem onClick={() => payInvoice.mutate({ id: invoice.id })}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === "draft" || invoice.status === "sent") && (
                              <DropdownMenuItem onClick={() => cancelInvoice.mutate(invoice.id)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" />
                                Cancel Invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
