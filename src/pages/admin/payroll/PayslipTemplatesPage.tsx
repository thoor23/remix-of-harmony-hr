import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Copy,
  Eye,
  FileText,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PayslipTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PayslipTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    content: DEFAULT_TEMPLATE_CONTENT,
    company_name: "",
    company_address: "",
    footer_text: "This is a computer-generated document and does not require a signature.",
    is_active: true,
  });

  const { data: templates = [], isLoading } = usePayslipTemplates();
  const { data: branding } = useCompanyBranding();
  const createMutation = useCreatePayslipTemplate();
  const updateMutation = useUpdatePayslipTemplate();
  const deleteMutation = useDeletePayslipTemplate();
  const setDefaultMutation = useSetDefaultPayslipTemplate();

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
      >
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length > 0 ? templates.map((template) => (
                <TableRow key={template.id}>
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
                  <TableCell className="text-muted-foreground">
                    {template.company_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.created_at ? format(new Date(template.created_at), "dd MMM yyyy") : "-"}
                  </TableCell>
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
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No templates found. Create your first template.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
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
              <div className="border rounded-lg p-4 bg-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: getPreviewHtml({
                      ...editingTemplate,
                      content: formData.content,
                      company_name: formData.company_name,
                      company_address: formData.company_address,
                      footer_text: formData.footer_text,
                    } as PayslipTemplate),
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.content.trim() || createMutation.isPending || updateMutation.isPending}
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
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="border rounded-lg p-4 bg-white">
              <div dangerouslySetInnerHTML={{ __html: getPreviewHtml(previewTemplate) }} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
