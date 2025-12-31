import { useState, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon, 
  MoreHorizontal, CheckCircle, XCircle, Wallet, Receipt,
  Clock, DollarSign, TrendingUp
} from "lucide-react";
import { useExpenseClaims, useExpenseCategories, useExpenseStats, useUpdateExpense, ExpenseClaim } from "@/hooks/useExpenses";
import { usePagination } from "@/hooks/usePagination";
import { format, isWithinInterval, startOfDay, endOfDay, isToday } from "date-fns";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: "employee_name", visible: true },
  { id: "employee_id", header: "Employee ID", accessor: "employee_code", visible: true },
  { id: "department", header: "Department", accessor: "department", visible: true },
  { id: "category", header: "Category", accessor: "category_name", visible: true },
  { id: "title", header: "Title", accessor: "title", visible: true },
  { id: "amount", header: "Amount", accessor: "amount", visible: true },
  { id: "expense_date", header: "Expense Date", accessor: "expense_date", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export default function ExpenseManagement() {
  const [viewMode, setViewMode] = useState<"all" | "today">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>("expense_date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "reimburse" | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseClaim | null>(null);
  const [reviewComments, setReviewComments] = useState("");

  const { data: expenses = [], isLoading, refetch, isFetching } = useExpenseClaims();
  const { data: categories = [] } = useExpenseCategories();
  const { data: stats } = useExpenseStats();
  const updateExpense = useUpdateExpense();

  // Transform expenses with additional info
  const transformedRecords = useMemo(() => {
    return expenses.map((record: ExpenseClaim) => {
      const emp = record.employee;
      return {
        ...record,
        employee_name: emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Unknown',
        employee_code: emp?.employee_id || '-',
        department: emp?.department?.name || '-',
        avatar_url: emp?.avatar_url || null,
        first_name: emp?.first_name || '',
        last_name: emp?.last_name || '',
        category_name: record.category?.name || '-',
      };
    });
  }, [expenses]);

  const filteredRecords = useMemo(() => {
    return transformedRecords.filter((record) => {
      const matchesSearch =
        record.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        record.title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || record.category_id === categoryFilter;

      const expenseDate = new Date(record.expense_date);
      let matchesDate = true;
      
      if (viewMode === "today") {
        matchesDate = isToday(expenseDate);
      } else if (dateRange?.from) {
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchesDate = isWithinInterval(expenseDate, { start: from, end: to });
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [transformedRecords, search, statusFilter, categoryFilter, viewMode, dateRange]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const sortedRecords = useMemo(() => {
    if (!sortColumn) return filteredRecords;
    
    return [...filteredRecords].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getNestedValue(a, column.accessor as string);
      const bValue = getNestedValue(b, column.accessor as string);
      
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
  }, [filteredRecords, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRecords, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? sortedRecords.filter(rec => selectedRows.has(rec.id))
      : sortedRecords;
    
    exportToCSV(dataToExport, columns, "expense_claims");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(rec => rec.id)));
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
    paginatedData.every(rec => selectedRows.has(rec.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleAction = (expense: ExpenseClaim, action: "approve" | "reject" | "reimburse") => {
    setSelectedExpense(expense);
    setActionType(action);
    setReviewComments("");
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedExpense || !actionType) return;

    const statusMap = {
      approve: "approved",
      reject: "rejected",
      reimburse: "reimbursed",
    };

    try {
      await updateExpense.mutateAsync({
        id: selectedExpense.id,
        status: statusMap[actionType] as any,
        review_comments: reviewComments || undefined,
      });
      toast.success(`Expense ${actionType}d successfully`);
      setActionDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${actionType} expense`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderCellValue = (record: any, column: ColumnDef) => {
    const value = typeof column.accessor === 'function' 
      ? column.accessor(record)
      : getNestedValue(record, column.accessor);

    if (column.id === 'employee_name') {
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={record.avatar_url || ""} />
            <AvatarFallback>
              {record.first_name?.[0] || ""}
              {record.last_name?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      );
    }

    if (column.id === 'amount') {
      return <span className="font-medium">{formatCurrency(Number(value) || 0)}</span>;
    }

    if (column.id === 'status') {
      return <StatusBadge status={value as StatusType} />;
    }

    if (column.id === 'expense_date') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'id') {
      return value ? (
        <span className="font-mono text-xs">{value.substring(0, 8)}...</span>
      ) : "—";
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">Review and manage employee expense claims</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "today")}>
          <TabsList>
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="today">Today's Submissions</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Pending Claims"
          value={stats?.pending || 0}
          icon={Clock}
          trend={{ value: stats?.pending || 0, isPositive: false }}
        />
        <StatCard
          title="Approved"
          value={stats?.approved || 0}
          icon={CheckCircle}
          trend={{ value: stats?.approved || 0, isPositive: true }}
        />
        <StatCard
          title="Total Approved Amount"
          value={formatCurrency(stats?.approvedAmount || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Reimbursed"
          value={stats?.reimbursed || 0}
          icon={DollarSign}
        />
      </div>

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, employee ID, or title..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {viewMode === "all" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full md:w-[280px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="reimbursed">Reimbursed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
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
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(record.id)}
                      onCheckedChange={(checked) => handleSelectRow(record.id, !!checked)}
                      aria-label={`Select ${record.employee_name}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(record, column)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {record.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction(record, "approve")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(record, "reject")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {record.status === "approved" && (
                          <DropdownMenuItem onClick={() => handleAction(record, "reimburse")}>
                            <DollarSign className="mr-2 h-4 w-4 text-blue-600" />
                            Mark as Reimbursed
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

        {paginatedData.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No expense claims found</h3>
                <p className="text-muted-foreground text-sm">
                  {search || statusFilter !== "all" || categoryFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "No expense claims have been submitted yet"}
                </p>
              </div>
            </div>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Expense"}
              {actionType === "reject" && "Reject Expense"}
              {actionType === "reimburse" && "Mark as Reimbursed"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "This will approve the expense claim for reimbursement."}
              {actionType === "reject" && "This will reject the expense claim. Please provide a reason."}
              {actionType === "reimburse" && "This will mark the expense as reimbursed."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>{" "}
                    <span className="font-medium">{selectedExpense.title}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    <span className="font-medium">{formatCurrency(Number(selectedExpense.amount))}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">
                  {actionType === "reject" ? "Reason for Rejection *" : "Comments (Optional)"}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={actionType === "reject" ? "Please provide a reason for rejection..." : "Add any comments..."}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={updateExpense.isPending || (actionType === "reject" && !reviewComments.trim())}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {updateExpense.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
