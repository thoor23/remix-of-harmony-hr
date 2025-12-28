import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, Star, Copy, Code, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import {
  useBannerTemplates,
  useCreateBannerTemplate,
  useUpdateBannerTemplate,
  useDeleteBannerTemplate,
  useSetDefaultBannerTemplate,
  BANNER_PLACEHOLDERS,
  PRIORITY_TYPES,
  DEFAULT_BANNER_HTML,
  BannerTemplate,
} from "@/hooks/useBannerTemplates";
import { useQueryClient } from "@tanstack/react-query";

export default function BannerTemplatesPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading, isFetching } = useBannerTemplates();
  const createTemplate = useCreateBannerTemplate();
  const updateTemplate = useUpdateBannerTemplate();
  const deleteTemplate = useDeleteBannerTemplate();
  const setDefault = useSetDefaultBannerTemplate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BannerTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<BannerTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Table state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "name", header: "Name", visible: true },
    { id: "priority_type", header: "Priority Type", visible: true },
    { id: "is_default", header: "Default", visible: true },
    { id: "created_at", header: "Created", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    html_content: DEFAULT_BANNER_HTML,
    priority_type: "all",
    is_default: false,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        case "priority_type":
          aVal = a.priority_type;
          bVal = b.priority_type;
          break;
        case "is_default":
          aVal = a.is_default ? 1 : 0;
          bVal = b.is_default ? 1 : 0;
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
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

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      html_content: DEFAULT_BANNER_HTML,
      priority_type: "all",
      is_default: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: BannerTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      html_content: template.html_content,
      priority_type: template.priority_type,
      is_default: template.is_default || false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
    } else {
      await createTemplate.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleSetDefault = async (template: BannerTemplate) => {
    await setDefault.mutateAsync({ id: template.id, priorityType: template.priority_type });
  };

  const handleDuplicate = (template: BannerTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      html_content: template.html_content,
      priority_type: template.priority_type,
      is_default: false,
    });
    setIsDialogOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData((prev) => ({
      ...prev,
      html_content: prev.html_content + placeholder,
    }));
  };

  const getPreviewHtml = (html: string) => {
    const sampleData: Record<string, string> = {
      "{{title}}": "Sample Announcement Title",
      "{{content}}": "This is a sample announcement content that will be displayed in the banner.",
      "{{priority}}": "Medium",
      "{{type}}": "General",
      "{{type_icon}}": "📢",
      "{{time_remaining}}": "2d 5h left",
      "{{expires_at}}": format(new Date(), "MMM dd, yyyy"),
      "{{published_at}}": format(new Date(), "MMM dd, yyyy"),
      "{{priority_color}}": "#CA8A04",
      "{{priority_bg}}": "rgba(202, 138, 4, 0.1)",
      "{{priority_border}}": "rgba(202, 138, 4, 0.3)",
    };

    let result = html;
    Object.entries(sampleData).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });
    return result;
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
      priority_type: PRIORITY_TYPES.find(p => p.value === t.priority_type)?.label || t.priority_type,
      is_default: t.is_default ? "Yes" : "No",
      created_at: format(new Date(t.created_at), "yyyy-MM-dd"),
    }));
    exportToCSV(data, columns, "banner-templates");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["banner-templates"] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Banner Templates"
        description="Design HTML templates for dashboard announcement banners"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={handleOpenCreate}
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
            <div className="text-muted-foreground p-6">Loading templates...</div>
          ) : !paginatedItems?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No banner templates yet. Create your first template.
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
                  {columns.find(c => c.id === "priority_type")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("priority_type")}>
                      <div className="flex items-center">Priority Type {getSortIcon("priority_type")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "is_default")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("is_default")}>
                      <div className="flex items-center">Default {getSortIcon("is_default")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "created_at")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center">Created {getSortIcon("created_at")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "actions")?.visible && (
                    <TableHead className="text-right">Actions</TableHead>
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
                    {columns.find(c => c.id === "priority_type")?.visible && (
                      <TableCell>
                        <Badge variant="outline">
                          {PRIORITY_TYPES.find((p) => p.value === template.priority_type)?.label || template.priority_type}
                        </Badge>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "is_default")?.visible && (
                      <TableCell>
                        {template.is_default ? (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template)}
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "created_at")?.visible && (
                      <TableCell>{format(new Date(template.created_at), "MMM dd, yyyy")}</TableCell>
                    )}
                    {columns.find(c => c.id === "actions")?.visible && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPreviewTemplate(template);
                              setIsPreviewOpen(true);
                            }}
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
                            onClick={() => handleOpenEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template.id)}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Banner Template" : "Create Banner Template"}
            </DialogTitle>
            <DialogDescription>
              Design your banner using HTML with placeholders
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Default Blue Banner"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority Type</Label>
                  <Select
                    value={formData.priority_type}
                    onValueChange={(value) => setFormData({ ...formData, priority_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label>Set as default template</Label>
                </div>

                {/* Placeholders */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Placeholders
                  </Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {BANNER_PLACEHOLDERS.map((ph) => (
                      <div
                        key={ph.key}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => insertPlaceholder(ph.key)}
                      >
                        <div>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {ph.key}
                          </code>
                          <p className="text-xs text-muted-foreground mt-1">{ph.description}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center: HTML Editor */}
              <div className="lg:col-span-2 space-y-4">
                <Tabs defaultValue="editor">
                  <TabsList>
                    <TabsTrigger value="editor">HTML Editor</TabsTrigger>
                    <TabsTrigger value="preview">Live Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="editor" className="mt-2">
                    <Textarea
                      value={formData.html_content}
                      onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                      className="font-mono text-sm min-h-[400px]"
                      placeholder="Enter your HTML template..."
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-2">
                    <div className="border rounded-lg p-4 min-h-[400px] bg-background">
                      <p className="text-xs text-muted-foreground mb-4">Preview with sample data:</p>
                      <div
                        dangerouslySetInnerHTML={{ __html: getPreviewHtml(formData.html_content) }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.html_content}
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Banner Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview how the banner will appear on the dashboard
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-background">
                <div
                  dangerouslySetInnerHTML={{
                    __html: getPreviewHtml(previewTemplate.html_content),
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Priority Type:</strong>{" "}
                {PRIORITY_TYPES.find((p) => p.value === previewTemplate.priority_type)?.label}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
