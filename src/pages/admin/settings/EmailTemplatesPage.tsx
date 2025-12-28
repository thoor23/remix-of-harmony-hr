import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, Copy, Eye, Star, Mail, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  EMAIL_TEMPLATE_TYPES,
  EMAIL_PLACEHOLDERS,
  getPlaceholdersForType,
  type EmailTemplateType,
} from "@/hooks/useEmailTemplates";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TemplateForm {
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
  is_default: boolean;
}

const defaultContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">{{company_name}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">Email Title</h2>
    <p>Dear {{recipient_name}},</p>
    <p>Your email content goes here...</p>
    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">This is an automated notification from {{company_name}} HRMS.</p>
  </div>
</body>
</html>`;

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading, isFetching } = useEmailTemplates();
  const { data: branding } = useCompanyBranding();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    type: "leave_approved",
    subject: "",
    content: defaultContent,
    is_default: false,
  });

  // Table state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "name", header: "Name", visible: true },
    { id: "type", header: "Type", visible: true },
    { id: "subject", header: "Subject", visible: true },
    { id: "is_default", header: "Default", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
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
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "subject":
          aVal = a.subject;
          bVal = b.subject;
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

  const { paginatedItems, ...pagination } = usePagination(sortedTemplates, { defaultPageSize: 10 });

  const openDialog = (template?: typeof templates[0]) => {
    if (template) {
      setEditingTemplate(template);
      setForm({
        name: template.name,
        type: template.type as EmailTemplateType,
        subject: template.subject,
        content: template.content,
        is_default: template.is_default,
      });
    } else {
      setEditingTemplate(null);
      setForm({
        name: "",
        type: "leave_approved",
        subject: "",
        content: defaultContent,
        is_default: false,
      });
    }
    setDialogOpen(true);
  };

  const handleTypeChange = (type: EmailTemplateType) => {
    setForm((prev) => ({
      ...prev,
      type,
    }));
  };

  const insertPlaceholder = (placeholder: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + placeholder,
    }));
    toast.success(`Inserted ${placeholder}`);
  };

  const insertSubjectPlaceholder = (placeholder: string) => {
    setForm((prev) => ({
      ...prev,
      subject: prev.subject + placeholder,
    }));
    toast.success(`Inserted ${placeholder} in subject`);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        name: form.name,
        type: form.type,
        subject: form.subject,
        content: form.content,
        is_default: form.is_default,
      });
    } else {
      await createTemplate.mutateAsync({
        name: form.name,
        type: form.type,
        subject: form.subject,
        content: form.content,
        is_default: form.is_default,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteDialog) {
      await deleteTemplate.mutateAsync(deleteDialog);
      setDeleteDialog(null);
    }
  };

  const handlePreview = (content: string) => {
    const companyLogoHtml = branding?.companyLogo 
      ? `<img src="${branding.companyLogo}" alt="${branding?.companyName || 'Company'}" style="max-height: 60px; max-width: 200px;" />`
      : `<span style="font-size: 24px; font-weight: bold; color: #333;">${branding?.companyName || 'Company Name'}</span>`;
    
    let previewHtml = content
      .replace(/\{\{company_name\}\}/g, branding?.companyName || "Company Name")
      .replace(/\{\{company_logo\}\}/g, companyLogoHtml)
      .replace(/\{\{recipient_name\}\}/g, "John Doe")
      .replace(/\{\{recipient_email\}\}/g, "john.doe@example.com")
      .replace(/\{\{employee_name\}\}/g, "Jane Smith")
      .replace(/\{\{leave_type\}\}/g, "Casual Leave")
      .replace(/\{\{start_date\}\}/g, "January 15, 2025")
      .replace(/\{\{end_date\}\}/g, "January 17, 2025")
      .replace(/\{\{days\}\}/g, "3")
      .replace(/\{\{reason\}\}/g, "Personal work")
      .replace(/\{\{status\}\}/g, "Approved")
      .replace(/\{\{approved_by\}\}/g, "HR Manager")
      .replace(/\{\{comments\}\}/g, "Approved. Enjoy your leave!")
      .replace(/\{\{ticket_subject\}\}/g, "System Access Issue")
      .replace(/\{\{ticket_category\}\}/g, "IT Support")
      .replace(/\{\{ticket_priority\}\}/g, "High")
      .replace(/\{\{pay_period\}\}/g, "January 2025")
      .replace(/\{\{pay_date\}\}/g, "January 31, 2025")
      .replace(/\{\{net_pay\}\}/g, "₹50,000")
      .replace(/\{\{app_url\}\}/g, window.location.origin)
      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
    
    previewHtml = previewHtml.replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    
    setPreviewContent(previewHtml);
    setPreviewOpen(true);
  };

  const handleDuplicate = (template: typeof templates[0]) => {
    setEditingTemplate(null);
    setForm({
      name: `${template.name} (Copy)`,
      type: template.type as EmailTemplateType,
      subject: template.subject,
      content: template.content,
      is_default: false,
    });
    setDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    return EMAIL_TEMPLATE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeCategory = (type: string) => {
    return EMAIL_TEMPLATE_TYPES.find((t) => t.value === type)?.category || "Other";
  };

  const placeholdersForType = getPlaceholdersForType(form.type);

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
      type: getTypeLabel(t.type),
      subject: t.subject,
      is_default: t.is_default ? "Yes" : "No",
    }));
    exportToCSV(data, columns, "email-templates");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["email-templates"] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Email Templates"
        description="Create and manage email templates for notifications"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => openDialog()}
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
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email templates found</p>
              <Button variant="outline" className="mt-4" onClick={() => openDialog()}>
                Create your first template
              </Button>
            </div>
          ) : (
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
                  {columns.find(c => c.id === "type")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                      <div className="flex items-center">Type {getSortIcon("type")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "subject")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("subject")}>
                      <div className="flex items-center">Subject {getSortIcon("subject")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "is_default")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("is_default")}>
                      <div className="flex items-center">Default {getSortIcon("is_default")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "actions")?.visible && (
                    <TableHead className="w-32">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((template) => (
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
                    {columns.find(c => c.id === "type")?.visible && (
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">
                            {getTypeCategory(template.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getTypeLabel(template.type)}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "subject")?.visible && (
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {template.subject}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "is_default")?.visible && (
                      <TableCell>
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "actions")?.visible && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(template.content)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ id: template.id, name: template.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              Design your email template with HTML and placeholders
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-4 flex-1 overflow-hidden">
            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Leave Approved Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {type.category}
                            </Badge>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Your Leave Request has been Approved"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Content (HTML)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your email template with HTML and placeholders..."
                  className="min-h-[350px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_default: checked }))}
                />
                <Label>Set as default template for this type</Label>
              </div>
            </div>

            {/* Right: Placeholders */}
            <div className="space-y-4 overflow-hidden flex flex-col">
              <Label>Insert Placeholders</Label>
              <ScrollArea className="flex-1 pr-2">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                    <TabsTrigger value="subject" className="text-xs">Subject</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="space-y-2 mt-2">
                    {placeholdersForType.map((p) => (
                      <Button
                        key={p.key}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertPlaceholder(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </TabsContent>
                  <TabsContent value="subject" className="space-y-2 mt-2">
                    {placeholdersForType.slice(0, 6).map((p) => (
                      <Button
                        key={p.key}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertSubjectPlaceholder(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
              <Button 
                variant="secondary" 
                onClick={() => handlePreview(form.content)}
                className="w-full"
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
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        itemName={deleteDialog?.name}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
