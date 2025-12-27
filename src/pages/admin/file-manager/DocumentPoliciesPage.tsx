import { useState, useRef } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Upload, Download, Trash2, FileText, Search } from "lucide-react";
import { useCompanyDocuments, useUploadFile, useDeleteDocument, downloadDocument } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";

const policyCategories = [
  "HR Policy",
  "Leave Policy",
  "Attendance Policy",
  "Code of Conduct",
  "Safety Guidelines",
  "IT Policy",
  "Travel Policy",
  "Expense Policy",
  "Other",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentPoliciesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useCompanyDocuments();
  const uploadFile = useUploadFile();
  const deleteDocument = useDeleteDocument();

  const [search, setSearch] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string; file_url?: string } | null>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName || !docCategory) return;

    await uploadFile.mutateAsync({
      file: selectedFile,
      name: docName,
      type: docCategory,
      is_company_document: true,
    });

    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocName("");
    setDocCategory("");
  };

  const handleDelete = async () => {
    if (deleteDialog) {
      await deleteDocument.mutateAsync(deleteDialog);
      setDeleteDialog(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Document Policies"
        description="Manage company policies and documents"
      />

      {/* Search and Upload */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Policy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Policies ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No policies uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.file_size ? formatFileSize(doc.file_size) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {doc.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadDocument(doc.file_url!, doc.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ id: doc.id, name: doc.name, file_url: doc.file_url || undefined })}
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

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Policy Document</DialogTitle>
            <DialogDescription>
              Add a new company policy document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{selectedFile?.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter policy name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {policyCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!docName || !docCategory || uploadFile.isPending}
            >
              {uploadFile.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title="Delete Policy"
        description="Are you sure you want to delete this policy? This action cannot be undone."
        itemName={deleteDialog?.name}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
