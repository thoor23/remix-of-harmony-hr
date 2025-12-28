import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Copy,
  Eye,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import {
  usePayslipTemplates,
  useCreatePayslipTemplate,
  useUpdatePayslipTemplate,
  useDeletePayslipTemplate,
  useSetDefaultPayslipTemplate,
  PAYSLIP_PLACEHOLDERS,
  type PayslipTemplate,
} from "@/hooks/usePayslipTemplates";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_TEMPLATE_CONTENT = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
    {{company_logo}}
    <h1 style="margin: 0; font-size: 24px; color: #333;">{{company_name}}</h1>
    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">{{company_address}}</p>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0; font-size: 20px; color: #333;">PAYSLIP - {{pay_period}}</h2>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <p><strong>Employee:</strong> {{employee_name}} ({{employee_id}})</p>
    <p><strong>Department:</strong> {{department}} | <strong>Designation:</strong> {{designation}}</p>
    <p><strong>Pay Date:</strong> {{pay_date}}</p>
  </div>
  
  <div style="display: flex; gap: 30px; margin-bottom: 30px;">
    <div style="flex: 1;">
      <h3 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Earnings</h3>
      <p>Basic Salary: {{basic_salary}}</p>
      <p>HRA: {{hra}}</p>
      <p>Transport: {{transport_allowance}}</p>
      <p>Medical: {{medical_allowance}}</p>
      <p>Other: {{other_allowances}}</p>
      <p><strong>Gross: {{gross_earnings}}</strong></p>
    </div>
    <div style="flex: 1;">
      <h3 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Deductions</h3>
      <p>PF: {{pf_deduction}}</p>
      <p>Tax: {{tax_deduction}}</p>
      <p>Other: {{other_deductions}}</p>
      <p><strong>Total: {{total_deductions}}</strong></p>
    </div>
  </div>
  
  <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0;">NET PAY: {{net_pay}}</h2>
  </div>
  
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">{{footer_text}}</p>
  <p style="text-align: center; color: #999; font-size: 12px;">Generated on: {{current_date}}</p>
</div>`;

export default function PayslipTemplatesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PayslipTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PayslipTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Table state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "name", header: "Template Name", visible: true },
    { id: "company_name", header: "Company", visible: true },
    { id: "is_active", header: "Status", visible: true },
    { id: "created_at", header: "Created", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    content: DEFAULT_TEMPLATE_CONTENT,
    company_name: "",
    company_address: "",
    footer_text: "This is a computer-generated document and does not require a signature.",
    is_active: true,
  });

  const { data: templates = [], isLoading, isFetching } = usePayslipTemplates();
  const { data: branding } = useCompanyBranding();
  const createMutation = useCreatePayslipTemplate();
  const updateMutation = useUpdatePayslipTemplate();
  const deleteMutation = useDeletePayslipTemplate();
  const setDefaultMutation = useSetDefaultPayslipTemplate();

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.company_name || "").toLowerCase().includes(searchQuery.toLowerCase())
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
        case "company_name":
          aVal = a.company_name || "";
          bVal = b.company_name || "";
          break;
        case "is_active":
          aVal = a.is_active ? 1 : 0;
          bVal = b.is_active ? 1 : 0;
          break;
        case "created_at":
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
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
      content: DEFAULT_TEMPLATE_CONTENT,
      company_name: "",
      company_address: "",
      footer_text: "This is a computer-generated document and does not require a signature.",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: PayslipTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      company_name: template.company_name || "",
      company_address: template.company_address || "",
      footer_text: template.footer_text || "",
      is_active: template.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      return;
    }

    if (editingTemplate) {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        ...formData,
        layout_config: {},
      });
    } else {
      await createMutation.mutateAsync({
        ...formData,
        layout_config: {},
        is_default: false,
        company_logo_url: null,
        created_by: null,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const insertPlaceholder = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + key,
    }));
  };

  const getPreviewHtml = (template: PayslipTemplate) => {
    const logoHtml = branding?.companyLogo 
      ? `<img src="${branding.companyLogo}" alt="Company Logo" style="max-height: 60px; margin-bottom: 10px;" />`
      : '';
    
    const sampleData: Record<string, string> = {
      "{{employee_name}}": "John Smith",
      "{{employee_id}}": "EMP001",
      "{{department}}": "Engineering",
      "{{designation}}": "Senior Developer",
      "{{pay_period}}": "December 2024",
      "{{pay_date}}": "31 Dec 2024",
      "{{basic_salary}}": "₹50,000.00",
      "{{hra}}": "₹20,000.00",
      "{{transport_allowance}}": "₹5,000.00",
      "{{medical_allowance}}": "₹3,000.00",
      "{{other_allowances}}": "₹2,000.00",
      "{{gross_earnings}}": "₹80,000.00",
      "{{pf_deduction}}": "₹6,000.00",
      "{{tax_deduction}}": "₹8,000.00",
      "{{other_deductions}}": "₹1,000.00",
      "{{total_deductions}}": "₹15,000.00",
      "{{net_pay}}": "₹65,000.00",
      "{{company_logo}}": logoHtml,
      "{{company_name}}": template.company_name || branding?.companyName || "Company Name Inc.",
      "{{company_address}}": template.company_address || branding?.companyAddress || "123 Business Street, City",
      "{{footer_text}}": template.footer_text || "This is a computer-generated document.",
      "{{current_date}}": format(new Date(), "dd MMM yyyy"),
    };

    let html = template.content;
    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });
    return html;
  };

  const groupedPlaceholders = PAYSLIP_PLACEHOLDERS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof PAYSLIP_PLACEHOLDERS>);

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
      company_name: t.company_name || "-",
      is_active: t.is_active ? "Active" : "Inactive",
      created_at: t.created_at ? format(new Date(t.created_at), "yyyy-MM-dd") : "-",
    }));
    exportToCSV(data, columns, "payslip-templates");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["payslip-templates"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Payslip Templates"
        description="Create and manage payslip templates for PDF generation"
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
          addRowLabel="Create Template"
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
                    <div className="flex items-center">Template Name {getSortIcon("name")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "company_name")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("company_name")}>
                    <div className="flex items-center">Company {getSortIcon("company_name")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "is_active")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("is_active")}>
                    <div className="flex items-center">Status {getSortIcon("is_active")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "created_at")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center">Created {getSortIcon("created_at")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "actions")?.visible && (
                  <TableHead className="w-48">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? paginatedItems.map((template) => (
                <TableRow key={template.id} data-state={selectedRows.includes(template.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(template.id)}
                      onCheckedChange={(checked) => handleSelectRow(template.id, !!checked)}
                    />
                  </TableCell>
                  {columns.find(c => c.id === "name")?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {columns.find(c => c.id === "company_name")?.visible && (
                    <TableCell className="text-muted-foreground">
                      {template.company_name || "-"}
                    </TableCell>
                  )}
                  {columns.find(c => c.id === "is_active")?.visible && (
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  )}
                  {columns.find(c => c.id === "created_at")?.visible && (
                    <TableCell className="text-muted-foreground">
                      {template.created_at ? format(new Date(template.created_at), "dd MMM yyyy") : "-"}
                    </TableCell>
                  )}
                  {columns.find(c => c.id === "actions")?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewTemplate(template)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(template)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!template.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDefaultMutation.mutate(template.id)}
                            title="Set as Default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(null);
                            setFormData({
                              name: `${template.name} (Copy)`,
                              content: template.content,
                              company_name: template.company_name || "",
                              company_address: template.company_address || "",
                              footer_text: template.footer_text || "",
                              is_active: true,
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(template.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No templates found. Create your first template.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Payslip Template"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Payslip"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Company Name Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <Input
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Business Street, City"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="This is a computer-generated document..."
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>Template Content (HTML) *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Enter HTML template..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insert Placeholder</Label>
                  <div className="border rounded-lg p-3 max-h-[400px] overflow-y-auto space-y-4">
                    {Object.entries(groupedPlaceholders).map(([category, placeholders]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                        <div className="flex flex-wrap gap-1">
                          {placeholders.map((p) => (
                            <Badge
                              key={p.key}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                              onClick={() => insertPlaceholder(p.key)}
                            >
                              {p.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg p-4 bg-white min-h-[500px]">
                {editingTemplate ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: getPreviewHtml({
                        ...editingTemplate,
                        ...formData,
                      } as PayslipTemplate),
                    }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: getPreviewHtml({
                        id: "preview",
                        name: formData.name,
                        content: formData.content,
                        company_name: formData.company_name,
                        company_address: formData.company_address,
                        footer_text: formData.footer_text,
                        is_active: formData.is_active,
                        is_default: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        company_logo_url: null,
                        layout_config: {},
                        created_by: null,
                      }),
                    }}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.content || createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="border rounded-lg p-4 bg-white">
              <div
                dangerouslySetInnerHTML={{
                  __html: getPreviewHtml(previewTemplate),
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
