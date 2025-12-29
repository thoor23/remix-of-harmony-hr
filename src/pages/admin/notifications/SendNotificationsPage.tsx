import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { Search, Send, Trash2, Users, Building2, User, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { useTargetedNotifications, useSendTargetedNotification, useDeleteTargetedNotification, SendTargetedNotificationData, TargetedNotification } from "@/hooks/useTargetedNotifications";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "title", header: "Title", accessor: "title", visible: true },
  { id: "message", header: "Message", accessor: "message", visible: false },
  { id: "type", header: "Type", accessor: "type", visible: true },
  { id: "priority", header: "Priority", accessor: "priority", visible: true },
  { id: "target_type", header: "Target", accessor: "target_type", visible: true },
  { id: "sent_at", header: "Sent At", accessor: "sent_at", visible: true },
  { id: "created_at", header: "Created", accessor: "created_at", visible: false },
];

export default function SendNotificationsPage() {
  const { data: notifications = [], isLoading, refetch, isFetching } = useTargetedNotifications();
  const { data: departments = [] } = useDepartmentsData();
  const { data: employees = [] } = useEmployees();
  const sendNotification = useSendTargetedNotification();
  const deleteNotification = useDeleteTargetedNotification();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<TargetedNotification | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState<SendTargetedNotificationData>({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    target_type: "all",
    target_ids: [],
  });

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "normal",
      target_type: "all",
      target_ids: [],
    });
    setSelectedDepartments([]);
    setSelectedEmployees([]);
  };

  const handleSubmit = async () => {
    let target_ids: string[] = [];
    if (formData.target_type === "department") {
      target_ids = selectedDepartments;
    } else if (formData.target_type === "employees") {
      target_ids = selectedEmployees;
    }
    await sendNotification.mutateAsync({ ...formData, target_ids });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteClick = (notification: TargetedNotification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete) {
      await deleteNotification.mutateAsync(notificationToDelete.id);
      setNotificationToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesSearch = notif.title.toLowerCase().includes(search.toLowerCase()) ||
        notif.message.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || notif.type === typeFilter;
      const matchesPriority = priorityFilter === "all" || notif.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [notifications, search, typeFilter, priorityFilter]);

  const sortedNotifications = useMemo(() => {
    if (!sortColumn) return filteredNotifications;
    return [...filteredNotifications].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      const aValue = (a as any)[column.accessor as string];
      const bValue = (b as any)[column.accessor as string];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [filteredNotifications, sortColumn, sortDirection, columns]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = 
    usePagination({ data: sortedNotifications, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => columns.filter(col => col.visible !== false), [columns]);

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? filteredNotifications.filter(notif => selectedRows.has(notif.id))
      : filteredNotifications;
    exportToCSV(dataToExport, columns, "notifications");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(notif => notif.id)));
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

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(notif => selectedRows.has(notif.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "info": return <Badge variant="secondary">Info</Badge>;
      case "warning": return <Badge className="bg-yellow-500">Warning</Badge>;
      case "success": return <Badge className="bg-green-500">Success</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500">High</Badge>;
      case "normal": return <Badge variant="secondary">Normal</Badge>;
      case "low": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTargetDisplay = (notification: TargetedNotification) => {
    if (notification.target_type === "all") {
      return <div className="flex items-center gap-1"><Users className="h-4 w-4" />All Employees</div>;
    }
    if (notification.target_type === "department") {
      return <div className="flex items-center gap-1"><Building2 className="h-4 w-4" />{notification.target_ids?.length || 0} Department(s)</div>;
    }
    return <div className="flex items-center gap-1"><User className="h-4 w-4" />{notification.target_ids?.length || 0} Employee(s)</div>;
  };

  const renderCellValue = (notification: TargetedNotification, column: ColumnDef) => {
    const value = (notification as any)[column.accessor as string];
    if (column.id === 'type') return getTypeBadge(value);
    if (column.id === 'priority') return getPriorityBadge(value);
    if (column.id === 'target_type') return getTargetDisplay(notification);
    if (column.id === 'sent_at' || column.id === 'created_at') {
      return value ? format(new Date(value), "MMM d, yyyy h:mm a") : "—";
    }
    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }
    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Send Notifications" description="Send targeted notifications to employees" />
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Send Notifications" description="Send targeted notifications to employees" />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => { resetForm(); setIsDialogOpen(true); }}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Send Notification"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
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
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
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
                        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
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
              {paginatedData.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(notification.id)}
                      onCheckedChange={(checked) => handleSelectRow(notification.id, !!checked)}
                      aria-label={`Select ${notification.title}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(notification, column)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(notification)}
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
        </div>

        {paginatedData.length === 0 && (
          <div className="py-12 px-4 text-center">
            <p className="text-muted-foreground">No notifications found. Send your first notification!</p>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedNotifications.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to selected employees or groups</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Target Recipients</Label>
              <Select
                value={formData.target_type}
                onValueChange={(value: "all" | "department" | "employees") => setFormData({ ...formData, target_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" />All Employees</div>
                  </SelectItem>
                  <SelectItem value="department">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />By Department</div>
                  </SelectItem>
                  <SelectItem value="employees">
                    <div className="flex items-center gap-2"><User className="h-4 w-4" />Specific Employees</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.target_type === "department" && (
              <div>
                <Label>Select Departments</Label>
                <ScrollArea className="h-40 border rounded-md p-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments found</p>
                  ) : (
                    <div className="space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={selectedDepartments.includes(dept.id)}
                            onCheckedChange={() => toggleDepartment(dept.id)}
                          />
                          <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer flex-1">{dept.name}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedDepartments.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedDepartments.length} department(s) selected</p>
                )}
              </div>
            )}

            {formData.target_type === "employees" && (
              <div>
                <Label>Select Employees</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No employees found</p>
                  ) : (
                    <div className="space-y-2">
                      {employees.filter((emp) => emp.status === "active").map((emp) => (
                        <div key={emp.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`emp-${emp.id}`}
                            checked={selectedEmployees.includes(emp.id)}
                            onCheckedChange={() => toggleEmployee(emp.id)}
                          />
                          <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer flex-1">
                            {emp.first_name} {emp.last_name} ({emp.employee_id})
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedEmployees.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedEmployees.length} employee(s) selected</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.title ||
                !formData.message ||
                (formData.target_type === "department" && selectedDepartments.length === 0) ||
                (formData.target_type === "employees" && selectedEmployees.length === 0)
              }
            >
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification record? This will not remove notifications already sent to employees.
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
    </PageContainer>
  );
}
