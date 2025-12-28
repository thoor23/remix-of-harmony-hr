import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit, Trash2, Copy, Eye, Star, Mail } from "lucide-react";
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
import { toast } from "sonner";

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
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { data: branding } = useCompanyBranding();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    type: "leave_approved",
    subject: "",
    content: defaultContent,
    is_default: false,
  });

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
    
    // Remove conditional blocks for preview
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

  return (
    <PageContainer>
      <PageHeader
        title="Email Templates"
        description="Create and manage email templates for notifications"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Templates
          </CardTitle>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
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
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      {template.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
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
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg bg-white text-gray-900"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title="Delete Email Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        itemName={deleteDialog?.name}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
