import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Folder, FileText, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAllDocuments } from "@/hooks/useDocuments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmployeeDocumentsPage() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: allDocuments = [], isLoading: loadingDocs } = useAllDocuments();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  return (
    <PageContainer>
      <PageHeader
        title="Employee Documents"
        description="Browse and manage documents organized by employee"
      />

      {/* Search and View Toggle */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Folders */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
            const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const docCount = docCountByEmployee[emp.id] || 0;

            return (
              <Card
                key={emp.id}
                className="cursor-pointer hover:border-primary transition-colors"
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
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Documents</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
                const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const docCount = docCountByEmployee[emp.id] || 0;

                return (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/file-manager/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.avatar_url || undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emp.employee_id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.department?.name || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="h-3 w-3" />
                        {docCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
