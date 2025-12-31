import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatCard } from "@/components/shared/StatCard";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, FileText, Search, MoreHorizontal, Eye, Send, Check, X, Download, RefreshCw, DollarSign, Clock, AlertTriangle, FileCheck, ArrowUpDown } from "lucide-react";
import { useInternalInvoices, useInvoiceStats, useSendInvoice, usePayInvoice, useCancelInvoice, useProcessRecurringInvoices } from "@/hooks/useInternalInvoices";
import { useLocations } from "@/hooks/useLocations";
import { usePagination } from "@/hooks/usePagination";
import { downloadInvoicePdf } from "@/lib/invoicePdfGenerator";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { InternalInvoice } from "@/types/invoice";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("invoice_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: invoices, isLoading, refetch, isRefetching } = useInternalInvoices({
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

  // Filter and sort data
  const filteredInvoices = useMemo(() => {
    let result = invoices || [];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((invoice) =>
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.from_location?.name.toLowerCase().includes(searchLower) ||
        invoice.to_location?.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "invoice_date":
          aVal = new Date(a.invoice_date).getTime();
          bVal = new Date(b.invoice_date).getTime();
          break;
        case "due_date":
          aVal = new Date(a.due_date).getTime();
          bVal = new Date(b.due_date).getTime();
          break;
        case "total_amount":
          aVal = Number(a.total_amount);
          bVal = Number(b.total_amount);
          break;
        case "invoice_number":
          aVal = a.invoice_number;
          bVal = b.invoice_number;
          break;
        default:
          aVal = a[sortField as keyof InternalInvoice];
          bVal = b[sortField as keyof InternalInvoice];
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [invoices, filters.search, sortField, sortOrder]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: filteredInvoices, defaultPageSize: 10 });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleDownloadPdf = async (invoice: InternalInvoice) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-internal-invoices/${invoice.id}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    const fullInvoice = await response.json();
    downloadInvoicePdf(fullInvoice);
  };

  const handleExport = () => {
    const columns: ColumnDef[] = [
      { id: "invoice_number", header: "Invoice #", accessor: "invoice_number" },
      { id: "invoice_type", header: "Type", accessor: (row) => invoiceTypeLabels[row.invoice_type] || row.invoice_type },
      { id: "from_location", header: "From Location", accessor: (row) => row.from_location?.name || "-" },
      { id: "to_location", header: "To Location", accessor: (row) => row.to_location?.name || "-" },
      { id: "invoice_date", header: "Invoice Date", accessor: (row) => format(new Date(row.invoice_date), "yyyy-MM-dd") },
      { id: "due_date", header: "Due Date", accessor: (row) => format(new Date(row.due_date), "yyyy-MM-dd") },
      { id: "total_amount", header: "Amount", accessor: (row) => Number(row.total_amount).toFixed(2) },
      { id: "status", header: "Status", accessor: (row) => statusConfig[row.status]?.label || row.status },
      { id: "is_recurring", header: "Recurring", accessor: (row) => row.is_recurring ? "Yes" : "No" },
    ];
    exportToCSV(filteredInvoices, columns, "internal-invoices");
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage all internal invoices</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
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
            <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.invoice_type || "all"} onValueChange={(v) => setFilters({ ...filters, invoice_type: v === "all" ? "" : v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Invoice Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense_reimbursement">Expense Reimbursement</SelectItem>
                <SelectItem value="internal_service">Internal Service</SelectItem>
                <SelectItem value="goods_transfer">Goods Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.from_location_id || "all"} onValueChange={(v) => setFilters({ ...filters, from_location_id: v === "all" ? "" : v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="From Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="No invoices found"
              description="Create your first invoice to get started."
              action={{
                label: "Create Invoice",
                onClick: () => navigate("/app/internal-billing/invoices/create")
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <SortableHeader field="invoice_number">Invoice #</SortableHeader>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <SortableHeader field="invoice_date">Date</SortableHeader>
                      <SortableHeader field="due_date">Due Date</SortableHeader>
                      <SortableHeader field="total_amount">Amount</SortableHeader>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((invoice) => (
                      <TableRow key={invoice.id} className={selectedIds.includes(invoice.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(invoice.id)}
                            onCheckedChange={(checked) => handleSelectRow(invoice.id, !!checked)}
                          />
                        </TableCell>
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

              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredInvoices.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
