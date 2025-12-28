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
import { Plus, Edit, Trash2, Copy, Eye, Star } from "lucide-react";
import {
  useLetterTemplates,
  useCreateLetterTemplate,
  useUpdateLetterTemplate,
  useDeleteLetterTemplate,
  LETTER_PLACEHOLDERS,
  DEFAULT_TEMPLATES,
  type LetterType,
} from "@/hooks/useLetterTemplates";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { toast } from "sonner";

const letterTypes: { value: LetterType; label: string }[] = [
  { value: "offer", label: "Offer Letter" },
  { value: "experience", label: "Experience Letter" },
  { value: "relieving", label: "Relieving Letter" },
  { value: "increment", label: "Increment Letter" },
  { value: "custom", label: "Custom" },
];

interface TemplateForm {
  name: string;
  type: LetterType;
  content: string;
  is_default: boolean;
}

export default function LetterTemplatesPage() {
  const { data: templates = [], isLoading } = useLetterTemplates();
  const { data: branding } = useCompanyBranding();
  const createTemplate = useCreateLetterTemplate();
  const updateTemplate = useUpdateLetterTemplate();
  const deleteTemplate = useDeleteLetterTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    type: "offer",
    content: "",
    is_default: false,
  });

  const openDialog = (template?: typeof templates[0]) => {
    if (template) {
      setEditingTemplate(template);
      setForm({
        name: template.name,
        type: template.type as LetterType,
        content: template.content,
        is_default: template.is_default,
      });
    } else {
      setEditingTemplate(null);
      setForm({
        name: "",
        type: "offer",
        content: DEFAULT_TEMPLATES.offer,
        is_default: false,
      });
    }
    setDialogOpen(true);
  };

  const handleTypeChange = (type: LetterType) => {
    setForm((prev) => ({
      ...prev,
      type,
      content: editingTemplate ? prev.content : DEFAULT_TEMPLATES[type],
    }));
  };

  const insertPlaceholder = (placeholder: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + placeholder,
    }));
    toast.success(`Inserted ${placeholder}`);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        name: form.name,
        type: form.type,
        content: form.content,
        is_default: form.is_default,
      });
    } else {
      await createTemplate.mutateAsync({
        name: form.name,
        type: form.type,
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
    // Replace placeholders with sample data including company logo
    const logoHtml = branding?.companyLogo 
      ? `<img src="${branding.companyLogo}" alt="Company Logo" style="max-height: 60px; margin-bottom: 10px;" />`
      : '';
    
    let previewHtml = content
      .replace(/\{\{company_logo\}\}/g, logoHtml)
      .replace(/\{\{company_name\}\}/g, branding?.companyName || "Company Name")
      .replace(/\{\{company_address\}\}/g, branding?.companyAddress || "123 Business Street, City");
    
    setPreviewContent(previewHtml);
    setPreviewOpen(true);
  };

  const handleDuplicate = (template: typeof templates[0]) => {
    setEditingTemplate(null);
    setForm({
      name: `${template.name} (Copy)`,
      type: template.type as LetterType,
      content: template.content,
      is_default: false,
    });
    setDialogOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Letter Templates"
        description="Create and manage letter templates for HR documents"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Templates</CardTitle>
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
              <p>No templates created yet</p>
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
                  <TableHead>Default</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      v{template.version}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Design your letter template with placeholders
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Offer Letter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Letter Type</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {letterTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template Content (HTML)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your letter template with placeholders..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_default: checked }))}
                />
                <Label>Set as default template for {form.type} letters</Label>
              </div>
            </div>

            {/* Right: Placeholders */}
            <div className="space-y-4">
              <Label>Insert Placeholders</Label>
              <Tabs defaultValue="employee" className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="employee">Employee</TabsTrigger>
                  <TabsTrigger value="company">Company</TabsTrigger>
                </TabsList>
                <TabsContent value="employee" className="space-y-2">
                  {LETTER_PLACEHOLDERS.employee.map((p) => (
                    <Button
                      key={p.key}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertPlaceholder(p.key)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </TabsContent>
                <TabsContent value="company" className="space-y-2">
                  {LETTER_PLACEHOLDERS.company.map((p) => (
                    <Button
                      key={p.key}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertPlaceholder(p.key)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </TabsContent>
              </Tabs>

              {form.type !== "custom" && (
                <div className="space-y-2">
                  <Label>{form.type.charAt(0).toUpperCase() + form.type.slice(1)} Specific</Label>
                  <div className="space-y-1">
                    {LETTER_PLACEHOLDERS[form.type]?.map((p) => (
                      <Button
                        key={p.key}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => insertPlaceholder(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Dates</Label>
                {LETTER_PLACEHOLDERS.dates.map((p) => (
                  <Button
                    key={p.key}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => insertPlaceholder(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
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
