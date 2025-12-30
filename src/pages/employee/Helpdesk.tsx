import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowUpDown, Eye, Search, X } from "lucide-react";
import { useMyTickets, useCreateTicket } from "@/hooks/useHelpdesk";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { TicketMessaging } from "@/components/helpdesk/TicketMessaging";
import { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"helpdesk_tickets">;

const defaultColumns: ColumnDef[] = [
  { id: "employee", header: "Employee", accessor: "employee", visible: true },
  { id: "email", header: "Email", accessor: "email", visible: true },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "store", header: "Store/Location", accessor: "store", visible: true },
  { id: "subject", header: "Subject", accessor: "subject", visible: true },
  { id: "category", header: "Category", accessor: "category", visible: true },
  { id: "priority", header: "Priority", accessor: "priority", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "created_at", header: "Created", accessor: "created_at", visible: true },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const categoryLabels: Record<string, string> = {
  payroll: "Payroll",
  leave: "Leave",
  attendance: "Attendance",
  documents: "Documents",
  benefits: "Benefits",
  general: "General",
  other: "Other",
};

export default function EmployeeHelpdesk() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: myTickets = [], isLoading: ticketsLoading, refetch } = useMyTickets();
  const createTicket = useCreateTicket();

  const isLoading = employeeLoading || ticketsLoading;

  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" || searchQuery;

  const handleClearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
  };

  // Filter by status, category, priority, and search
  const filteredTickets = useMemo(() => {
    let data = [...myTickets];
    
    if (statusFilter !== "all") {
      if (statusFilter === "open") {
        data = data.filter((t) => t.status === "open" || t.status === "in-progress");
      } else if (statusFilter === "resolved") {
        data = data.filter((t) => t.status === "resolved" || t.status === "closed");
      } else {
        data = data.filter((t) => t.status === statusFilter);
      }
    }
    
    if (categoryFilter !== "all") {
      data = data.filter((t) => t.category === categoryFilter);
    }
    
    if (priorityFilter !== "all") {
      data = data.filter((t) => t.priority === priorityFilter);
    }
    
    if (searchQuery) {
      data = data.filter((t) => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return data;
  }, [myTickets, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  // Sort
  const sortedTickets = useMemo(() => {
    if (!sortConfig) return filteredTickets;
    return [...filteredTickets].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTickets, sortConfig]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedTickets, defaultPageSize: 10 });

  const openTickets = myTickets.filter((t) => t.status === "open" || t.status === "in-progress");
  const resolvedTickets = myTickets.filter((t) => t.status === "resolved" || t.status === "closed");

  const handleCreateTicket = () => {
    if (!subject || !category || !priority) return;

    createTicket.mutate(
      { subject, description, category, priority },
      {
        onSuccess: () => {
          setIsNewTicketOpen(false);
          setCategory("");
          setPriority("");
          setSubject("");
          setDescription("");
        },
      }
    );
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible } : col))
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? sortedTickets.filter((t) => selectedRows.has(t.id))
      : sortedTickets;
    
    const exportData = dataToExport.map((t) => ({
      ...t,
      created_at: new Date(t.created_at).toLocaleDateString(),
      department: currentEmployee?.department?.name || "-",
      store: currentEmployee?.primary_store?.name || "-",
    }));
    exportToCSV(exportData, columns, "helpdesk-tickets");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((t) => t.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Tickets" description="Submit and track your support requests" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader title="My Tickets" description="Submit and track your support requests" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{openTickets.length}</p>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{resolvedTickets.length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{myTickets.length}</p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Tickets Table */}
        <Card className="overflow-hidden">
            <DataTableToolbar
              columns={columns}
              onToggleColumn={handleToggleColumn}
              onExport={handleExport}
              onRefresh={() => refetch()}
              onToggleFilter={() => setShowFilters(!showFilters)}
              showFilter={showFilters}
              isRefreshing={isLoading}
              onAddRow={() => setIsNewTicketOpen(true)}
              addRowLabel="New Ticket"
            />

            {showFilters && (
              <div className="p-4 border-b bg-muted/30 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Priority Filter */}
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1.5">
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}

          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 whitespace-nowrap">
                    <Checkbox
                      checked={paginatedData.length > 0 && paginatedData.every((t) => selectedRows.has(t.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.map((col) => (
                    <TableHead 
                      key={col.id}
                      className={`whitespace-nowrap ${
                        col.id === "employee" ? "min-w-[180px]" :
                        col.id === "email" ? "min-w-[180px]" :
                        col.id === "subject" ? "min-w-[200px]" :
                        col.id === "department" ? "min-w-[120px]" :
                        col.id === "store" ? "min-w-[120px]" :
                        col.id === "category" ? "min-w-[100px]" :
                        col.id === "priority" ? "min-w-[90px]" :
                        col.id === "status" ? "min-w-[100px]" :
                        col.id === "created_at" ? "min-w-[100px]" :
                        ""
                      }`}
                    >
                      {col.id !== "employee" && col.id !== "email" && col.id !== "department" && col.id !== "store" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort(col.id)}
                        >
                          {col.header}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-16 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? paginatedData.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="whitespace-nowrap">
                      <Checkbox
                        checked={selectedRows.has(ticket.id)}
                        onCheckedChange={(checked) => handleSelectRow(ticket.id, checked as boolean)}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id} className="whitespace-nowrap">
                        {col.id === "employee" ? (
                          <EmployeeCell
                            avatarUrl={currentEmployee?.avatar_url}
                            firstName={currentEmployee?.first_name}
                            lastName={currentEmployee?.last_name}
                            employeeId={currentEmployee?.employee_id}
                          />
                        ) : col.id === "email" ? (
                          <span className="text-muted-foreground">{currentEmployee?.email || "-"}</span>
                        ) : col.id === "department" ? (
                          <span>{currentEmployee?.department?.name || "-"}</span>
                        ) : col.id === "store" ? (
                          <span>{currentEmployee?.primary_store?.name || "-"}</span>
                        ) : col.id === "subject" ? (
                          <span className="font-medium">{ticket.subject}</span>
                        ) : col.id === "category" ? (
                          categoryLabels[ticket.category] || ticket.category
                        ) : col.id === "priority" ? (
                          <Badge className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        ) : col.id === "status" ? (
                          <StatusBadge status={ticket.status as any} />
                        ) : col.id === "created_at" ? (
                          new Date(ticket.created_at).toLocaleDateString()
                        ) : (
                          ticket[col.id as keyof typeof ticket] || "-"
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center text-muted-foreground py-8">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>

        {/* Ticket Detail / Messages */}
        {selectedTicket && (
          <Card>
            <TicketMessaging
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              isAdmin={false}
            />
          </Card>
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="benefits">Benefits</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about your issue..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!subject || !category || !priority || createTicket.isPending}
            >
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
