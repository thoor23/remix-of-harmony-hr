import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  File,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { useEmployee } from "@/hooks/useEmployees";
import { useAllDocuments, useUploadFile, useDeleteDocument, downloadDocument } from "@/hooks/useDocuments";
import { useGeneratedLetters } from "@/hooks/useGeneratedLetters";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DocumentPreview } from "@/components/documents/DocumentPreview";

const documentTypes = [
  "ID Proof",
  "Address Proof",
  "Educational Certificate",
  "Experience Letter",
  "Offer Letter",
  "Contract",
  "Other",
];

function getFileIcon(type: string) {
  if (type.includes("image")) return FileImage;
  if (type.includes("pdf")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmployeeFolderPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employee, isLoading: loadingEmployee } = useEmployee(employeeId || "");
  const { data: allDocuments = [], isLoading: loadingDocs } = useAllDocuments();
  const { data: generatedLetters = [] } = useGeneratedLetters(employeeId);
  const uploadFile = useUploadFile();
  const deleteDocument = useDeleteDocument();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string; file_url?: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; type: string; file_url: string } | null>(null);

  // Filter documents for this employee
  const employeeDocuments = allDocuments.filter((doc) => doc.employee_id === employeeId);

  const fullName = employee
    ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    : "Employee";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName || !docType || !employeeId) return;

    await uploadFile.mutateAsync({
      file: selectedFile,
      name: docName,
      type: docType,
      employee_id: employeeId,
    });

    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocName("");
    setDocType("");
  };

  const handleDelete = async () => {
    if (deleteDialog) {
      await deleteDocument.mutateAsync(deleteDialog);
      setDeleteDialog(null);
    }
  };

  const isLoading = loadingEmployee || loadingDocs;

  return (
    <PageContainer>

      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/file-manager")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${fullName}'s Documents`}
          description={employee?.employee_id || ""}
        />
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Upload documents for this employee
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({employeeDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employeeDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
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
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewDoc({ name: doc.name, type: doc.type, file_url: doc.file_url! })}
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => downloadDocument(doc.file_url!, doc.name)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ id: doc.id, name: doc.name, file_url: doc.file_url || undefined })}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generated Letters Section */}
      {generatedLetters.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Letters ({generatedLetters.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Letter Type</TableHead>
                  <TableHead>Generated On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedLetters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium capitalize">{letter.type} Letter</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(letter.generated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{letter.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a document to {fullName}'s folder
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
              <Label>Document Name</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
              disabled={!docName || !docType || uploadFile.isPending}
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
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        itemName={deleteDialog?.name}
        onConfirm={handleDelete}
      />

      {/* Document Preview */}
      <DocumentPreview
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        document={previewDoc}
        onDownload={previewDoc ? () => downloadDocument(previewDoc.file_url, previewDoc.name) : undefined}
      />
    </PageContainer>
  );
}
