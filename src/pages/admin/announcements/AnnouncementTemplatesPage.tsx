import { useState, useRef, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import {
  Plus,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Star,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAnnouncementTemplates,
  useCreateAnnouncementTemplate,
  useUpdateAnnouncementTemplate,
  useDeleteAnnouncementTemplate,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_PLACEHOLDERS,
  DEFAULT_ANNOUNCEMENT_TEMPLATE,
} from "@/hooks/useAnnouncementTemplates";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useQueryClient } from "@tanstack/react-query";
import { useHasPermission } from "@/components/auth/PermissionGate";

interface TemplateForm {
  name: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  is_default: boolean;
}

const initialForm: TemplateForm = {
  name: "",
  title: "",
  content: DEFAULT_ANNOUNCEMENT_TEMPLATE,
  type: "general",
  priority: "medium",
  target_audience: "all",
  is_default: false,
};

export default function AnnouncementTemplatesPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading, isFetching } = useAnnouncementTemplates();
  const createTemplate = useCreateAnnouncementTemplate();
  const updateTemplate = useUpdateAnnouncementTemplate();
  const deleteTemplate = useDeleteAnnouncementTemplate();
  const { data: branding } = useCompanyBranding();

  const canCreate = useHasPermission("Templates", "create");
  const canUpdate = useHasPermission("Templates", "update");
  const canDelete = useHasPermission("Templates", "delete");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(initialForm);
  const [previewContent, setPreviewContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Table state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "name", header: "Name", visible: true },
    { id: "title", header: "Title", visible: true },
    { id: "type", header: "Type", visible: true },
    { id: "priority", header: "Priority", visible: true },
    { id: "target_audience", header: "Audience", visible: true },
    { id: "is_default", header: "Default", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "priority":
          aVal = a.priority;
          bVal = b.priority;
          break;
        case "target_audience":
          aVal = a.target_audience;
          bVal = b.target_audience;
          break;
        case "is_default":
          aVal = a.is_default ? 1 : 0;
          bVal = b.is_default ? 1 : 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTemplates, sortColumn, sortDirection]);

  const pagination = usePagination({ data: sortedTemplates, defaultPageSize: 10 });
  const paginatedItems = pagination.paginatedData;

  const openDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template.id);
      setForm({
        name: template.name,
        title: template.title,
        content: template.content,
        type: template.type,
        priority: template.priority,
        target_audience: template.target_audience,
        is_default: template.is_default || false,
      });
    } else {
      setEditingTemplate(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = contentRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        form.content.substring(0, start) +
        placeholder +
        form.content.substring(end);
      setForm({ ...form, content: newContent });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + placeholder.length,
          start + placeholder.length
        );
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim() || !form.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate,
          ...form,
        });
      } else {
        await createTemplate.mutateAsync(form);
      }
      setDialogOpen(false);
      setForm(initialForm);
      setEditingTemplate(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;
    try {
      await deleteTemplate.mutateAsync(deleteTemplateId);
      setDeleteDialogOpen(false);
      setDeleteTemplateId(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePreview = () => {
    let preview = form.content;
    const now = new Date();
    
    preview = preview.replace(/\{\{company_name\}\}/g, branding?.companyName || "Your Company");
    preview = preview.replace(/\{\{company_address\}\}/g, branding?.companyAddress || "123 Business Street");
    preview = preview.replace(/\{\{company_phone\}\}/g, branding?.companyPhone || "+1 234 567 890");
    preview = preview.replace(/\{\{company_email\}\}/g, branding?.companyEmail || "info@company.com");
    preview = preview.replace(/\{\{company_website\}\}/g, branding?.companyWebsite || "www.company.com");
    preview = preview.replace(/\{\{current_date\}\}/g, now.toLocaleDateString());
    preview = preview.replace(/\{\{current_time\}\}/g, now.toLocaleTimeString());
    preview = preview.replace(/\{\{current_year\}\}/g, now.getFullYear().toString());
    preview = preview.replace(/\{\{announcement_title\}\}/g, form.title || "Sample Announcement Title");
    preview = preview.replace(/\{\{announcement_type\}\}/g, ANNOUNCEMENT_TYPES.find(t => t.value === form.type)?.label || form.type);
    preview = preview.replace(/\{\{announcement_priority\}\}/g, ANNOUNCEMENT_PRIORITIES.find(p => p.value === form.priority)?.label || form.priority);
    
    setPreviewContent(preview);
    setPreviewOpen(true);
  };

  const handleDuplicate = (template: any) => {
    setEditingTemplate(null);
    setForm({
      name: `${template.name} (Copy)`,
      title: template.title,
      content: template.content,
      type: template.type,
      priority: template.priority,
      target_audience: template.target_audience,
      is_default: false,
    });
    setDialogOpen(true);
  };

  const getTypeLabel = (value: string) => 
    ANNOUNCEMENT_TYPES.find(t => t.value === value)?.label || value;
  
  const getPriorityLabel = (value: string) => 
    ANNOUNCEMENT_PRIORITIES.find(p => p.value === value)?.label || value;
  
  const getAudienceLabel = (value: string) => 
    ANNOUNCEMENT_AUDIENCES.find(a => a.value === value)?.label || value;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedItems.map((t) => t.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const data = sortedTemplates.map(t => ({
      name: t.name,
      title: t.title,
      type: getTypeLabel(t.type),
      priority: getPriorityLabel(t.priority),
      target_audience: getAudienceLabel(t.target_audience),
      is_default: t.is_default ? "Yes" : "No",
    }));
    exportToCSV(data, columns, "announcement-templates");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Announcement Templates"
        description="Create and manage reusable announcement templates"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={canCreate ? () => openDialog() : undefined}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="New Template"
        />

        {showFilter && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.find(c => c.id === "name")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">Name {getSortIcon("name")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "title")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                    <div className="flex items-center">Title {getSortIcon("title")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "type")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                    <div className="flex items-center">Type {getSortIcon("type")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "priority")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                    <div className="flex items-center">Priority {getSortIcon("priority")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "target_audience")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("target_audience")}>
                    <div className="flex items-center">Audience {getSortIcon("target_audience")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "is_default")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("is_default")}>
                    <div className="flex items-center">Default {getSortIcon("is_default")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "actions")?.visible && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading templates...
                  </TableCell>
                </TableRow>
              ) : paginatedItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No templates yet</p>
                    <Button
                      variant="link"
                      onClick={() => openDialog()}
                      className="mt-2"
                    >
                      Create your first template
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems?.map((template) => (
                  <TableRow key={template.id} data-state={selectedRows.includes(template.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(template.id)}
                        onCheckedChange={(checked) => handleSelectRow(template.id, !!checked)}
                      />
                    </TableCell>
                    {columns.find(c => c.id === "name")?.visible && (
                      <TableCell className="font-medium">{template.name}</TableCell>
                    )}
                    {columns.find(c => c.id === "title")?.visible && (
                      <TableCell className="max-w-[200px] truncate">{template.title}</TableCell>
                    )}
                    {columns.find(c => c.id === "type")?.visible && (
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "priority")?.visible && (
                      <TableCell>
                        <Badge variant={getPriorityColor(template.priority) as any}>
                          {getPriorityLabel(template.priority)}
                        </Badge>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "target_audience")?.visible && (
                      <TableCell>{getAudienceLabel(template.target_audience)}</TableCell>
                    )}
                    {columns.find(c => c.id === "is_default")?.visible && (
                      <TableCell>
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "actions")?.visible && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setForm({
                                name: template.name,
                                title: template.title,
                                content: template.content,
                                type: template.type,
                                priority: template.priority,
                                target_audience: template.target_audience,
                                is_default: template.is_default || false,
                              });
                              handlePreview();
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(template)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDialog(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteTemplateId(template.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Announcement Template"}
            </DialogTitle>
            <DialogDescription>
              Design your announcement template with placeholders for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4">
            {/* Form Section */}
            <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Holiday Announcement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => setForm({ ...form, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) => setForm({ ...form, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select
                    value={form.target_audience}
                    onValueChange={(value) => setForm({ ...form, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_AUDIENCES.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Announcement Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Important: Office Closure Notice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML) *</Label>
                <Textarea
                  id="content"
                  ref={contentRef}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter your announcement content..."
                  className="min-h-[250px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={form.is_default}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_default: checked })
                  }
                />
                <Label htmlFor="is_default">Set as default template</Label>
              </div>
            </div>

            {/* Placeholder Sidebar */}
            <div className="border-l pl-4">
              <h4 className="font-medium mb-2 text-sm">Insert Placeholders</h4>
              <Tabs defaultValue="company" className="w-full">
                <TabsList className="w-full grid grid-cols-3 text-xs">
                  <TabsTrigger value="company">Company</TabsTrigger>
                  <TabsTrigger value="dates">Dates</TabsTrigger>
                  <TabsTrigger value="announcement">Info</TabsTrigger>
                </TabsList>
                <ScrollArea className="h-[300px] mt-2">
                  <TabsContent value="company" className="mt-0 space-y-1">
                    {ANNOUNCEMENT_PLACEHOLDERS.company.map((p) => (
                      <Button
                        key={p.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertPlaceholder(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </TabsContent>
                  <TabsContent value="dates" className="mt-0 space-y-1">
                    {ANNOUNCEMENT_PLACEHOLDERS.dates.map((p) => (
                      <Button
                        key={p.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertPlaceholder(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </TabsContent>
                  <TabsContent value="announcement" className="mt-0 space-y-1">
                    {ANNOUNCEMENT_PLACEHOLDERS.announcement.map((p) => (
                      <Button
                        key={p.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertPlaceholder(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={handlePreview}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-6 bg-white text-gray-900 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
