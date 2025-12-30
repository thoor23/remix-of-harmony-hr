import { useRef, useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { Download, FileText, File, FolderOpen, Upload, Loader2, X, Search, ArrowUpDown } from "lucide-react";
import { useMyDocuments, useCompanyDocuments, useUploadFile, downloadDocument } from "@/hooks/useDocuments";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

type SortField = "name" | "type" | "created_at" | "file_size";
type SortDirection = "asc" | "desc";

export default function EmployeeDocuments() {
  const { data: myDocuments = [], isLoading: myDocsLoading, isFetching } = useMyDocuments();
  const { data: companyDocuments = [], isLoading: companyDocsLoading } = useCompanyDocuments();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const uploadFile = useUploadFile();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Column definitions
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "email", header: "Email", visible: true },
    { id: "department", header: "Department", visible: true },
    { id: "store", header: "Store/Location", visible: true },
    { id: "name", header: "Name", visible: true },
    { id: "type", header: "Type", visible: true },
    { id: "file_size", header: "Size", visible: true },
    { id: "created_at", header: "Uploaded", visible: true },
  ]);

  // Filter and sort documents
  const filteredMyDocs = useMemo(() => {
    let docs = [...myDocuments];
    if (searchQuery) {
      docs = docs.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return docs.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case "file_size":
          aVal = a.file_size || 0;
          bVal = b.file_size || 0;
          break;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [myDocuments, searchQuery, sortField, sortDirection]);

  const filteredCompanyDocs = useMemo(() => {
    let docs = [...companyDocuments];
    if (searchQuery) {
      docs = docs.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return docs.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case "file_size":
          aVal = a.file_size || 0;
          bVal = b.file_size || 0;
          break;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [companyDocuments, searchQuery, sortField, sortDirection]);

  // Pagination for personal documents
  const personalPagination = usePagination({ data: filteredMyDocs, defaultPageSize: 10 });
  const companyPagination = usePagination({ data: filteredCompanyDocs, defaultPageSize: 10 });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 flex items-center gap-1 -ml-3 font-medium hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );

  const handleSelectAll = (checked: boolean, docs: typeof myDocuments) => {
    if (checked) {
      setSelectedRows(docs.map((d) => d.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  };

  const handleExport = () => {
    const docs = activeTab === "personal" ? filteredMyDocs : filteredCompanyDocs;
    const dataToExport = selectedRows.length > 0
      ? docs.filter((d) => selectedRows.includes(d.id))
      : docs;

    const exportData = dataToExport.map((d) => ({
      ...d,
      department: currentEmployee?.department?.name || "-",
      store: currentEmployee?.primary_store?.name || "-",
    }));

    const exportColumns: ColumnDef[] = [
      { id: "name", header: "Name", visible: true },
      { id: "type", header: "Type", visible: true },
      { id: "department", header: "Department", visible: true },
      { id: "store", header: "Store/Location", visible: true },
      { id: "file_size", header: "Size (bytes)", visible: true },
      { id: "created_at", header: "Uploaded", visible: true },
    ];

    exportToCSV(exportData, exportColumns, `my-documents-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success(`Exported ${dataToExport.length} documents`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    queryClient.invalidateQueries({ queryKey: ["company-documents"] });
  };

  const handleDownload = async (docId: string, docName: string) => {
    await downloadDocument(docId, docName);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      await uploadFile.mutateAsync({
        file: selectedFile,
        name: selectedFile.name,
        type: selectedFile.type || "document",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploadOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 500);
    } catch {
      setUploadProgress(0);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLoading = myDocsLoading || companyDocsLoading || employeeLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Documents" description="Access your personal and company documents" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const renderDocumentTable = (
    docs: typeof myDocuments,
    pagination: typeof personalPagination,
    isPersonal: boolean
  ) => (
    <Card>
      <DataTableToolbar
        columns={columns}
        onToggleColumn={handleToggleColumn}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onToggleFilter={() => setShowFilters(!showFilters)}
        showFilter={showFilters}
        isRefreshing={isFetching}
        onAddRow={isPersonal ? () => setIsUploadOpen(true) : undefined}
        addRowLabel="Upload"
      />

      {showFilters && (
        <div className="px-4 py-3 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={pagination.paginatedData.length > 0 && selectedRows.length === pagination.paginatedData.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean, pagination.paginatedData)}
              />
            </TableHead>
            {columns.find((c) => c.id === "employee")?.visible && (
              <TableHead>Employee</TableHead>
            )}
            {columns.find((c) => c.id === "email")?.visible && (
              <TableHead>Email</TableHead>
            )}
            {columns.find((c) => c.id === "department")?.visible && (
              <TableHead>Department</TableHead>
            )}
            {columns.find((c) => c.id === "store")?.visible && (
              <TableHead>Store/Location</TableHead>
            )}
            {columns.find((c) => c.id === "name")?.visible && (
              <TableHead><SortableHeader field="name">Name</SortableHeader></TableHead>
            )}
            {columns.find((c) => c.id === "type")?.visible && (
              <TableHead><SortableHeader field="type">Type</SortableHeader></TableHead>
            )}
            {columns.find((c) => c.id === "file_size")?.visible && (
              <TableHead><SortableHeader field="file_size">Size</SortableHeader></TableHead>
            )}
            {columns.find((c) => c.id === "created_at")?.visible && (
              <TableHead><SortableHeader field="created_at">Uploaded</SortableHeader></TableHead>
            )}
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedData.map((doc) => (
            <TableRow key={doc.id} data-state={selectedRows.includes(doc.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.includes(doc.id)}
                  onCheckedChange={(checked) => handleSelectRow(doc.id, checked as boolean)}
                />
              </TableCell>
              {columns.find((c) => c.id === "employee")?.visible && (
                <TableCell>
                  <EmployeeCell
                    avatarUrl={currentEmployee?.avatar_url}
                    firstName={currentEmployee?.first_name}
                    lastName={currentEmployee?.last_name}
                    employeeId={currentEmployee?.employee_id}
                  />
                </TableCell>
              )}
              {columns.find((c) => c.id === "email")?.visible && (
                <TableCell className="text-muted-foreground">{currentEmployee?.email || "-"}</TableCell>
              )}
              {columns.find((c) => c.id === "department")?.visible && (
                <TableCell>{currentEmployee?.department?.name || "-"}</TableCell>
              )}
              {columns.find((c) => c.id === "store")?.visible && (
                <TableCell>{currentEmployee?.primary_store?.name || "-"}</TableCell>
              )}
              {columns.find((c) => c.id === "name")?.visible && (
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{doc.name}</span>
                  </div>
                </TableCell>
              )}
              {columns.find((c) => c.id === "type")?.visible && (
                <TableCell className="text-muted-foreground">{doc.type}</TableCell>
              )}
              {columns.find((c) => c.id === "file_size")?.visible && (
                <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size)}</TableCell>
              )}
              {columns.find((c) => c.id === "created_at")?.visible && (
                <TableCell className="text-muted-foreground">{format(new Date(doc.created_at), "MMM dd, yyyy")}</TableCell>
              )}
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id, doc.name)}>
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pagination.paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={docs.length}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader title="My Documents" description="Access your personal and company documents" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{myDocuments.length}</p>
              <p className="text-sm text-muted-foreground">Personal Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <File className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{companyDocuments.length}</p>
              <p className="text-sm text-muted-foreground">Company Policies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{myDocuments.length + companyDocuments.length}</p>
              <p className="text-sm text-muted-foreground">Total Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="personal">My Documents</TabsTrigger>
          <TabsTrigger value="company">Company Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          {renderDocumentTable(filteredMyDocs, personalPagination, true)}
        </TabsContent>

        <TabsContent value="company">
          {renderDocumentTable(filteredCompanyDocs, companyPagination, false)}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />

          <div className="space-y-4 py-4">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select a file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={cancelUpload}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="h-2" />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadFile.isPending}>
              {uploadFile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
