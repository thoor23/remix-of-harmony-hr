import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Building2, Plus, Search, MoreHorizontal, Eye, Edit, Power } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function CompanyList() {
  const { companies, companiesLoading, toggleCompanyStatus } = useSuperAdmin();
  const [search, setSearch] = useState("");

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.code.toLowerCase().includes(search.toLowerCase()) ||
      company.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Companies"
      description="Manage all companies on the platform"
      actions={
        <Link to="/super-admin/companies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </Link>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Companies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No companies found</h3>
              <p className="text-muted-foreground">
                {search ? "Try a different search term" : "Add your first company to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {company.code}
                      </code>
                    </TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {company.subscription_plan || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.employee_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(company.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/super-admin/companies/${company.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/super-admin/companies/${company.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleCompanyStatus({
                                id: company.id,
                                isActive: !company.is_active,
                              })
                            }
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {company.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
