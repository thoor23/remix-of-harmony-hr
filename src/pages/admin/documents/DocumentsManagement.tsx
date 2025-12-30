import { useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Upload, Eye } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const categoryLabels: Record<string, string> = {
  "hr_policy": "HR Policy",
  "leave_policy": "Leave Policy",
  "code_of_conduct": "Code of Conduct",
  "benefits": "Benefits",
  "company_policy": "Company Policy",
  "employee_doc": "Employee Document",
  "other": "Other",
};

export default function DocumentsManagement() {
  const { data: documentsData, isLoading } = useDocuments();

  // Filter for company/policy documents
  const policyDocuments = useMemo(() => {
    if (!documentsData) return [];
    return documentsData.filter(doc => doc.is_company_document);
  }, [documentsData]);

  const handleDownload = (fileUrl: string | null, name: string) => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Documents & Policies"
        description="Manage company policies and document templates"
      >
        <Link to="/admin/file-manager/policies">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Manage Documents
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Policy Documents</CardTitle>
            <Link to="/admin/file-manager/policies">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : policyDocuments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No policy documents</h3>
                    <p className="text-muted-foreground text-sm">
                      Upload company policies to get started
                    </p>
                  </div>
                  <Link to="/admin/file-manager/policies">
                    <Button className="mt-2">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Policy
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            {doc.folder_path && (
                              <p className="text-sm text-muted-foreground">
                                {doc.folder_path}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[doc.document_category || 'other'] || doc.document_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="uppercase text-xs font-medium text-muted-foreground">
                        {doc.type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(doc.file_url!, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(doc.file_url, doc.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Document Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Letter Templates</CardTitle>
            <Link to="/admin/letters/templates">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Offer Letter", type: "offer-letter", path: "/admin/letters/offer" },
                { name: "Experience Letter", type: "experience-letter", path: "/admin/letters/experience" },
                { name: "Relieving Letter", type: "relieving-letter", path: "/admin/letters/relieving" },
                { name: "Increment Letter", type: "increment-letter", path: "/admin/letters/increment" },
              ].map((template) => (
                <div
                  key={template.type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/admin/letters/templates">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Link to={template.path}>
                      <Button variant="ghost" size="sm">
                        Generate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/letters/offer" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Offer Letter
              </Button>
            </Link>
            <Link to="/admin/letters/experience" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Experience Letter
              </Button>
            </Link>
            <Link to="/admin/letters/relieving" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Relieving Letter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
