import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, File, FolderOpen, Upload } from "lucide-react";
import { useMyDocuments, useCompanyDocuments } from "@/hooks/useDocuments";
import { toast } from "sonner";

export default function EmployeeDocuments() {
  const { data: myDocuments = [], isLoading: myDocsLoading } = useMyDocuments();
  const { data: companyDocuments = [], isLoading: companyDocsLoading } = useCompanyDocuments();

  const handleDownload = (docName: string) => {
    toast.success(`Downloading ${docName}`);
  };

  const handleRequestDocument = (type: string) => {
    toast.success(`Request for ${type} submitted. HR will review your request.`);
  };

  const isLoading = myDocsLoading || companyDocsLoading;

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

  return (
    <PageContainer>
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
                  {myDocuments.length > 0 ? (
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
                                {doc.type} • Uploaded on {new Date(doc.created_at).toLocaleDateString()}
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
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No personal documents found
                    </div>
                  )}
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
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleRequestDocument("Experience Letter")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Experience Letter
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleRequestDocument("Salary Certificate")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Salary Certificate
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleRequestDocument("Employment Certificate")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Employment Certificate
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleRequestDocument("Bonafide Letter")}
                  >
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
              {companyDocuments.length > 0 ? (
                <div className="space-y-3">
                  {companyDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{doc.type}</Badge>
                          </div>
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No company documents available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
