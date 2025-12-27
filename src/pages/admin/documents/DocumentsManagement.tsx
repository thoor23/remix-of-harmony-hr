import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { Plus, FileText, Download, Upload } from "lucide-react";
import { policyDocuments } from "@/data/mockData";

const categoryLabels: Record<string, string> = {
  "hr-policy": "HR Policy",
  "leave-policy": "Leave Policy",
  "code-of-conduct": "Code of Conduct",
  benefits: "Benefits",
  other: "Other",
};

export default function DocumentsManagement() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Documents & Policies" }]} />

      <PageHeader
        title="Documents & Policies"
        description="Manage company policies and document templates"
      >
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Policy Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
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
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[doc.category] || doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Document Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Letter Templates</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Offer Letter", type: "offer-letter" },
                { name: "Experience Letter", type: "experience-letter" },
                { name: "Relieving Letter", type: "relieving-letter" },
                { name: "Increment Letter", type: "increment-letter" },
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
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Offer Letter
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Experience Letter
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Relieving Letter
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
