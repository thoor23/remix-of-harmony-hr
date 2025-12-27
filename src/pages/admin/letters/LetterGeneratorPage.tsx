import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Printer, Eye } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useLetterTemplates, DEFAULT_TEMPLATES, type LetterType } from "@/hooks/useLetterTemplates";
import { useGenerateLetter, replacePlaceholders } from "@/hooks/useGeneratedLetters";
import { generateLetterPDF, printLetter } from "@/lib/letterPdfGenerator";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  letterType: LetterType;
  title: string;
}

export default function LetterGeneratorPage({ letterType, title }: Props) {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: templates = [], isLoading: loadingTemplates } = useLetterTemplates(letterType);
  const generateLetter = useGenerateLetter();

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const employee = employees.find((e) => e.id === selectedEmployee);
  const template = templates.find((t) => t.id === selectedTemplate);

  // Extra fields based on letter type
  const extraFieldsConfig: Record<LetterType, { key: string; label: string; type?: string }[]> = {
    offer: [
      { key: "offered_salary", label: "Offered Salary (Annual)" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "offered_designation", label: "Offered Designation" },
    ],
    experience: [
      { key: "last_working_day", label: "Last Working Day", type: "date" },
      { key: "tenure", label: "Tenure (e.g., 2 years 3 months)" },
    ],
    relieving: [
      { key: "last_working_day", label: "Last Working Day", type: "date" },
      { key: "resignation_date", label: "Resignation Date", type: "date" },
    ],
    increment: [
      { key: "current_salary", label: "Current Salary (Annual)" },
      { key: "new_salary", label: "New Salary (Annual)" },
      { key: "increment_percentage", label: "Increment %" },
      { key: "effective_date", label: "Effective Date", type: "date" },
    ],
    custom: [],
  };

  const getPlaceholderData = (): Record<string, string> => {
    const data: Record<string, string> = {
      // Employee data
      employee_name: employee ? `${employee.profile?.first_name || ""} ${employee.profile?.last_name || ""}`.trim() : "",
      employee_id: employee?.employee_id || "",
      designation: employee?.designation?.name || "",
      department: employee?.department?.name || "",
      date_of_joining: employee?.date_of_joining ? format(new Date(employee.date_of_joining), "MMMM d, yyyy") : "",
      email: employee?.profile?.email || "",
      // Company data (defaults - can be customized)
      company_name: "Your Company Name",
      company_address: "123 Business Street, City, State 12345",
      hr_name: "HR Manager",
      hr_designation: "Human Resources",
      // Dates
      current_date: format(new Date(), "MMMM d, yyyy"),
      current_year: new Date().getFullYear().toString(),
      // Extra fields
      ...extraFields,
    };
    return data;
  };

  const handleGeneratePreview = () => {
    if (!employee) {
      toast.error("Please select an employee");
      return;
    }

    const content = template?.content || DEFAULT_TEMPLATES[letterType];
    const placeholderData = getPlaceholderData();
    const renderedContent = replacePlaceholders(content, placeholderData);
    setPreviewContent(renderedContent);
    setShowPreview(true);
  };

  const handleDownloadPDF = () => {
    if (!previewContent) {
      handleGeneratePreview();
      return;
    }
    const filename = `${letterType}-letter-${employee?.employee_id || "doc"}.pdf`;
    generateLetterPDF(previewContent, filename);
    toast.success("PDF downloaded");
  };

  const handlePrint = () => {
    if (!previewContent) {
      handleGeneratePreview();
      return;
    }
    printLetter(previewContent);
  };

  const handleSaveToFolder = async () => {
    if (!employee || !previewContent) {
      toast.error("Please generate a preview first");
      return;
    }

    await generateLetter.mutateAsync({
      employee_id: employee.id,
      template_id: template?.id,
      type: letterType,
      content: previewContent,
      metadata: extraFields,
    });
  };

  const isLoading = loadingEmployees || loadingTemplates;

  return (
    <PageContainer>
      <PageHeader title={title} description={`Generate ${title.toLowerCase()} for employees`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Letter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.profile?.first_name} {emp.profile?.last_name} ({emp.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select 
                    value={selectedTemplate || "default"} 
                    onValueChange={(val) => setSelectedTemplate(val === "default" ? "" : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use default template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {t.is_default && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Extra fields */}
                {extraFieldsConfig[letterType].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type || "text"}
                      value={extraFields[field.key] || ""}
                      onChange={(e) =>
                        setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button onClick={handleGeneratePreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleSaveToFolder}
                    disabled={generateLetter.isPending}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Save to Employee Folder
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {showPreview && previewContent ? (
              <div
                className="border rounded-lg p-6 bg-white min-h-[500px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>Select an employee and click Preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
