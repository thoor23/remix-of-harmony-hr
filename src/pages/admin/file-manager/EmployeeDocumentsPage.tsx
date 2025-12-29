import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Folder, FileText, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAllDocuments } from "@/hooks/useDocuments";

type ViewMode = "grid" | "list";

export default function EmployeeDocumentsPage() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: allDocuments = [], isLoading: loadingDocs } = useAllDocuments();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredEmployees = employees.filter((emp) => {
    const name = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
    const id = emp.employee_id.toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  // Count documents per employee
  const docCountByEmployee = allDocuments.reduce((acc, doc) => {
    if (doc.employee_id) {
      acc[doc.employee_id] = (acc[doc.employee_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const isLoading = loadingEmployees || loadingDocs;

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredEmployees.map((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
        const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
        const docCount = docCountByEmployee[emp.id] || 0;

        return (
          <Card
            key={emp.id}
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => navigate(`/admin/file-manager/${emp.id}`)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Folder className="h-8 w-8 text-primary" />
                </div>
                <Avatar className="h-8 w-8 absolute -bottom-1 -right-1 border-2 border-background">
                  <AvatarImage src={emp.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <p className="font-medium truncate w-full">{fullName}</p>
              <p className="text-sm text-muted-foreground mb-3">{emp.employee_id}</p>
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {docCount} {docCount === 1 ? "file" : "files"}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredEmployees.map((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
        const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
        const docCount = docCountByEmployee[emp.id] || 0;

        return (
          <Card
            key={emp.id}
            className="cursor-pointer hover:border-primary hover:shadow-sm transition-all"
            onClick={() => navigate(`/admin/file-manager/${emp.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={emp.avatar_url || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <Folder className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fullName}</p>
                  <p className="text-sm text-muted-foreground">{emp.employee_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {docCount}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Employee Documents"
        description="Browse and manage documents organized by employee"
      />

      {/* Search and View Toggle */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="border rounded-lg p-1"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Employee Folders */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-40" : "h-20"} />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4" />
            <p>No employees found</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        renderGridView()
      ) : (
        renderListView()
      )}
    </PageContainer>
  );
}
