import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, File, FolderOpen, Upload } from "lucide-react";
import { policyDocuments } from "@/data/mockData";
import { toast } from "sonner";

export default function EmployeeDocuments() {
  const handleDownload = (docName: string) => {
    toast.success(`Downloading ${docName}`);
  };

  // Personal documents (mock)
  const myDocuments = [
    { id: "1", name: "Offer Letter", type: "offer-letter", uploadedAt: "2022-01-10" },
    { id: "2", name: "NDA Agreement", type: "agreement", uploadedAt: "2022-01-10" },
    { id: "3", name: "ID Proof (Aadhar)", type: "id-proof", uploadedAt: "2022-01-15" },
    { id: "4", name: "Address Proof", type: "address-proof", uploadedAt: "2022-01-15" },
    { id: "5", name: "Educational Certificates", type: "education", uploadedAt: "2022-01-15" },
    { id: "6", name: "Previous Experience Letter", type: "experience", uploadedAt: "2022-01-15" },
  ];

  const categoryLabels: Record<string, string> = {
    "hr-policy": "HR Policy",
    "leave-policy": "Leave Policy",
    "code-of-conduct": "Code of Conduct",
    benefits: "Benefits",
    other: "Other",
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "My Documents" }]} />

      <PageHeader title="My Documents" description="Access your personal and company documents" />

      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">My Documents</TabsTrigger>
          <TabsTrigger value="company">Company Policies</TabsTrigger>
        </TabsList>

        {/* Personal Documents */}
        <TabsContent value="personal">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Personal Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded on {doc.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Request Document */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Experience Letter
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Salary Certificate
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Employment Certificate
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Bonafide Letter
                  </Button>
                </CardContent>
              </Card>

              {/* Upload Document */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag & drop or click to upload
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Company Documents */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Company Policies & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {policyDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {categoryLabels[doc.category] || doc.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{doc.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc.title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
