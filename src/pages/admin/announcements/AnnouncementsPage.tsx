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
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { Search, Edit, Trash2, Eye, FileText, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, Announcement } from "@/hooks/useAnnouncements";
import { useAnnouncementTemplates } from "@/hooks/useAnnouncementTemplates";
import { useBannerTemplates } from "@/hooks/useBannerTemplates";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "title", header: "Title", accessor: "title", visible: true },
  { id: "content", header: "Content", accessor: "content", visible: false },
  { id: "type", header: "Type", accessor: "type", visible: true },
  { id: "priority", header: "Priority", accessor: "priority", visible: true },
  { id: "target_audience", header: "Target", accessor: "target_audience", visible: true },
  { id: "is_active", header: "Status", accessor: "is_active", visible: true },
  { id: "published_at", header: "Published", accessor: "published_at", visible: true },
  { id: "scheduled_at", header: "Scheduled", accessor: "scheduled_at", visible: false },
  { id: "expires_at", header: "Expires", accessor: "expires_at", visible: false },
  { id: "created_at", header: "Created", accessor: "created_at", visible: false },
];

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading, refetch, isFetching } = useAnnouncements();
  const { data: templates = [] } = useAnnouncementTemplates();
  const { data: bannerTemplates = [] } = useBannerTemplates();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    priority: "normal",
    target_audience: "all",
    scheduled_date: "",
    scheduled_time: "",
    expires_date: "",
    expires_time: "",
    banner_template_id: "none",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "general",
      priority: "normal",
      target_audience: "all",
      scheduled_date: "",
      scheduled_time: "",
      expires_date: "",
      expires_time: "",
      banner_template_id: "none",
    });
    setEditingAnnouncement(null);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      const scheduledAt = announcement.scheduled_at ? new Date(announcement.scheduled_at) : null;
      const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        target_audience: announcement.target_audience,
        scheduled_date: scheduledAt ? scheduledAt.toISOString().split("T")[0] : "",
        scheduled_time: scheduledAt ? `${scheduledAt.getHours().toString().padStart(2, "0")}:${scheduledAt.getMinutes().toString().padStart(2, "0")}` : "",
        expires_date: expiresAt ? expiresAt.toISOString().split("T")[0] : "",
        expires_time: expiresAt ? `${expiresAt.getHours().toString().padStart(2, "0")}:${expiresAt.getMinutes().toString().padStart(2, "0")}` : "",
        banner_template_id: announcement.banner_template_id || "none",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        title: template.title,
        content: template.content,
        type: template.type,
        priority: template.priority,
        target_audience: template.target_audience,
      }));
    }
  };

  const combineDateTime = (date: string, time: string): string | null => {
    if (!date) return null;
    const dateObj = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      dateObj.setHours(hours, minutes, 0, 0);
    }
    return dateObj.toISOString();
  };

  const handleSubmit = async () => {
    const scheduled_at = combineDateTime(formData.scheduled_date, formData.scheduled_time);
    const expires_at = combineDateTime(formData.expires_date, formData.expires_time);
    
    if (editingAnnouncement) {
      await updateAnnouncement.mutateAsync({
        id: editingAnnouncement.id,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        target_audience: formData.target_audience,
        scheduled_at,
        expires_at,
        banner_template_id: formData.banner_template_id === "none" ? null : formData.banner_template_id,
      });
    } else {
      await createAnnouncement.mutateAsync({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        target_audience: formData.target_audience,
        scheduled_at,
        expires_at,
        banner_template_id: formData.banner_template_id === "none" ? null : formData.banner_template_id,
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (announcementToDelete) {
      await deleteAnnouncement.mutateAsync(announcementToDelete.id);
      setAnnouncementToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch = ann.title.toLowerCase().includes(search.toLowerCase()) ||
        ann.content.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || ann.type === typeFilter;
      const matchesPriority = priorityFilter === "all" || ann.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [announcements, search, typeFilter, priorityFilter]);

  const sortedAnnouncements = useMemo(() => {
    if (!sortColumn) return filteredAnnouncements;
    return [...filteredAnnouncements].sort((a, b) => {
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
  }, [filteredAnnouncements, sortColumn, sortDirection, columns]);

  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } = 
    usePagination({ data: sortedAnnouncements, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => columns.filter(col => col.visible !== false), [columns]);

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? filteredAnnouncements.filter(ann => selectedRows.has(ann.id))
      : filteredAnnouncements;
    exportToCSV(dataToExport, columns, "announcements");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(ann => ann.id)));
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

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(ann => selectedRows.has(ann.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const scheduledAt = announcement.scheduled_at ? new Date(announcement.scheduled_at) : null;
    const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;
    if (!announcement.is_active) return <Badge variant="secondary">Inactive</Badge>;
    if (expiresAt && expiresAt < now) return <Badge variant="destructive">Expired</Badge>;
    if (scheduledAt && scheduledAt > now) return <Badge variant="outline">Scheduled</Badge>;
    return <Badge variant="default">Active</Badge>;
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

  const renderCellValue = (announcement: Announcement, column: ColumnDef) => {
    const value = (announcement as any)[column.accessor as string];
    if (column.id === 'is_active') return getStatusBadge(announcement);
    if (column.id === 'priority') return getPriorityBadge(value);
    if (column.id === 'type' || column.id === 'target_audience') {
      return <span className="capitalize">{value}</span>;
    }
    if (column.id === 'published_at' || column.id === 'scheduled_at' || column.id === 'expires_at' || column.id === 'created_at') {
      return value ? format(new Date(value), "MMM d, yyyy") : "—";
    }
    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }
    return value || "—";
  };

  const selectedBannerTemplate = bannerTemplates.find((t) => t.id === formData.banner_template_id);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Announcements" description="Create and manage company-wide announcements" />
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
      <PageHeader title="Announcements" description="Create and manage company-wide announcements" />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => handleOpenDialog()}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Create Announcement"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
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
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
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
              {paginatedData.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(announcement.id)}
                      onCheckedChange={(checked) => handleSelectRow(announcement.id, !!checked)}
                      aria-label={`Select ${announcement.title}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(announcement, column)}
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(announcement)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(announcement)}
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
            <p className="text-muted-foreground">No announcements found. Create your first announcement!</p>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedAnnouncements.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? "Update the announcement details" : "Create a new company-wide announcement"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingAnnouncement && templates.length > 0 && (
              <div>
                <Label>Load from Template</Label>
                <Select onValueChange={handleLoadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement content..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
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
              <Label>Target Audience</Label>
              <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="managers">Managers Only</SelectItem>
                  <SelectItem value="hr">HR Only</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Date (Optional)</Label>
                <DatePicker
                  value={formData.scheduled_date}
                  onChange={(value) => setFormData({ ...formData, scheduled_date: value })}
                  placeholder="Select date"
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule Time (Optional)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:MM"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expires Date (Optional)</Label>
                <DatePicker
                  value={formData.expires_date}
                  onChange={(value) => setFormData({ ...formData, expires_date: value })}
                  placeholder="Select date"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires Time (Optional)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:MM"
                  value={formData.expires_time}
                  onChange={(e) => setFormData({ ...formData, expires_time: e.target.value })}
                />
              </div>
            </div>

            {bannerTemplates.length > 0 && (
              <div>
                <Label>Banner Template (Optional)</Label>
                <Select
                  value={formData.banner_template_id}
                  onValueChange={(value) => setFormData({ ...formData, banner_template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a banner template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Banner</SelectItem>
                    {bannerTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBannerTemplate && (
                  <div className="mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setPreviewBanner(selectedBannerTemplate.html_content)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Banner
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.content}>
              {editingAnnouncement ? "Update" : "Create"} Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.
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

      {/* Banner Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Banner Preview</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div className="border rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: previewBanner }} />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
