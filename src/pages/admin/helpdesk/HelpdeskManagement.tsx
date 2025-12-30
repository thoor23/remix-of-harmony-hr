import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { TicketMessaging } from "@/components/helpdesk/TicketMessaging";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import {
  useAllTickets,
  useUpdateTicketStatus,
  useAssignTicket,
  useDeleteTicket,
  TicketWithEmployee,
} from "@/hooks/useAllTickets";
import { useEmployees } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { EmployeeCell } from "@/components/shared/EmployeeCell";

// Define all ticket columns
const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "Ticket ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: (t: TicketWithEmployee) => 
    `${t.employee?.first_name || ''} ${t.employee?.last_name || ''}`.trim() || 'Unknown', visible: true },
  { id: "subject", header: "Subject", accessor: "subject", visible: true },
  { id: "category", header: "Category", accessor: "category", visible: true },
  { id: "priority", header: "Priority", accessor: "priority", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "assigned_to", header: "Assigned To", accessor: (t: TicketWithEmployee) => 
    t.assignee ? `${t.assignee.first_name || ''} ${t.assignee.last_name || ''}`.trim() : 'Unassigned', visible: true },
  { id: "created_at", header: "Created", accessor: "created_at", visible: true },
  { id: "updated_at", header: "Updated", accessor: "updated_at", visible: false },
  { id: "description", header: "Description", accessor: "description", visible: false },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-destructive/20 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  it: "IT Support",
  hr: "HR",
  payroll: "Payroll",
  leave: "Leave",
  other: "Other",
};

export default function HelpdeskManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketWithEmployee | null>(null);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEmployee | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: tickets = [], isLoading, refetch, isFetching } = useAllTickets();
  const { data: employees = [] } = useEmployees();
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();
  const deleteTicket = useDeleteTicket();

  // Calculate stats
  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const total = tickets.length;
    return { open, inProgress, resolved, total };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const employeeName = `${ticket.employee?.first_name || ''} ${ticket.employee?.last_name || ''}`.toLowerCase();
      const subject = ticket.subject?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      const matchesSearch =
        subject.includes(searchLower) ||
        employeeName.includes(searchLower) ||
        ticket.id.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const getNestedValue = (obj: any, accessor: string | ((item: any) => any)): any => {
    if (typeof accessor === 'function') return accessor(obj);
    return accessor.split('.').reduce((current, key) => current?.[key], obj);
  };

  const sortedTickets = useMemo(() => {
    if (!sortColumn) return filteredTickets;
    
    return [...filteredTickets].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getNestedValue(a, column.accessor);
      const bValue = getNestedValue(b, column.accessor);
      
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
  }, [filteredTickets, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedTickets, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleDeleteClick = (ticket: TicketWithEmployee) => {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      deleteTicket.mutate(ticketToDelete.id);
      setTicketToDelete(null);
    }
    setDeleteDialogOpen(false);
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
      ? filteredTickets.filter(t => selectedRows.has(t.id))
      : filteredTickets;
    
    exportToCSV(dataToExport, columns, "helpdesk-tickets");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(t => t.id)));
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
    paginatedData.every(t => selectedRows.has(t.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleViewTicket = (ticket: TicketWithEmployee) => {
    setSelectedTicket(ticket);
    setDetailSheetOpen(true);
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    updateStatus.mutate({ ticketId, status });
  };

  const handleAssign = (ticketId: string, employeeId: string | null) => {
    assignTicket.mutate({ ticketId, assignedTo: employeeId });
  };

  const renderCellValue = (ticket: TicketWithEmployee, column: ColumnDef) => {
    const value = getNestedValue(ticket, column.accessor);

    // Employee cell with avatar
    if (column.id === 'employee_name') {
      return (
        <EmployeeCell
          firstName={ticket.employee?.first_name}
          lastName={ticket.employee?.last_name}
          employeeId={ticket.employee?.employee_id}
        />
      );
    }

    // Ticket ID - truncated
    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }

    // Priority badge
    if (column.id === 'priority') {
      return (
        <Badge className={priorityColors[value] || ''} variant="secondary">
          {value?.charAt(0).toUpperCase() + value?.slice(1)}
        </Badge>
      );
    }

    // Status badge
    if (column.id === 'status') {
      return (
        <Badge className={statusColors[value] || ''} variant="secondary">
          {value === 'in-progress' ? 'In Progress' : value?.charAt(0).toUpperCase() + value?.slice(1)}
        </Badge>
      );
    }

    // Category badge
    if (column.id === 'category') {
      return (
        <Badge variant="outline">
          {categoryLabels[value] || value}
        </Badge>
      );
    }

    // Date formatting
    if (column.id === 'created_at' || column.id === 'updated_at') {
      return value ? format(new Date(value), "MMM dd, yyyy HH:mm") : "—";
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Helpdesk Management" description="Manage and respond to employee support tickets" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Helpdesk Management"
        description="Manage and respond to employee support tickets"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Open Tickets"
          value={stats.open}
          icon={AlertCircle}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={Ticket}
          className="border-l-4 border-l-primary"
        />
      </div>

      <Card>
        {/* Toolbar */}
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
        />

        {/* Filters */}
        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, employee, or ticket ID..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
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
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-40">
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="it">IT Support</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Table */}
        <ScrollArea className="w-full whitespace-nowrap" hideScrollbar={false}>
          <Table>
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
              {paginatedData.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTicket(ticket)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.has(ticket.id)}
                      onCheckedChange={(checked) => handleSelectRow(ticket.id, !!checked)}
                      aria-label={`Select ticket ${ticket.subject}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(ticket, column)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'open')}>
                          Set Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'in-progress')}>
                          Set In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'resolved')}>
                          Set Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'closed')}>
                          Set Closed
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(ticket)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {paginatedData.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <Ticket className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No tickets found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No support tickets have been submitted yet"}
              </p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Ticket Details
            </SheetTitle>
            <SheetDescription>
              View and respond to this support ticket
            </SheetDescription>
          </SheetHeader>

          {selectedTicket && (
            <div className="mt-6 space-y-6">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                  <p className="text-lg font-semibold">{selectedTicket.subject}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Employee</h4>
                    <p>{selectedTicket.employee?.first_name} {selectedTicket.employee?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.employee?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                    <p>{format(new Date(selectedTicket.created_at), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge className={statusColors[selectedTicket.status]} variant="secondary">
                    {selectedTicket.status === 'in-progress' ? 'In Progress' : selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                  </Badge>
                  <Badge className={priorityColors[selectedTicket.priority]} variant="secondary">
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                  </Badge>
                </div>

                {selectedTicket.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(status) => {
                      handleStatusChange(selectedTicket.id, status);
                      setSelectedTicket({ ...selectedTicket, status });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedTicket.assigned_to || "unassigned"}
                    onValueChange={(value) => {
                      const assignedTo = value === "unassigned" ? null : value;
                      handleAssign(selectedTicket.id, assignedTo);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Assign To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {employees.filter(e => e.status === 'active').map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Messages */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4">Messages</h4>
                <TicketMessaging ticket={selectedTicket as any} isAdmin={true} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
