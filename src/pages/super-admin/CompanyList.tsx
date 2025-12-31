import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ColumnDef } from "@/lib/csvExport";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Power,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { TablePagination } from "@/components/shared/TablePagination";
import { toast } from "sonner";

type SortField = "name" | "code" | "email" | "subscription_plan" | "employee_count" | "created_at";
type SortDirection = "asc" | "desc";

const getInitialColumns = (): ColumnDef[] => [
  { id: "checkbox", header: "", accessor: "", visible: true },
  { id: "company", header: "Company", accessor: "name", visible: true },
  { id: "code", header: "Code", accessor: "code", visible: true },
  { id: "email", header: "Email", accessor: "email", visible: true },
  { id: "subscription_plan", header: "Plan", accessor: "subscription_plan", visible: true },
  { id: "employee_count", header: "Employees", accessor: "employee_count", visible: true },
  { id: "status", header: "Status", accessor: "is_active", visible: true },
  { id: "created_at", header: "Created", accessor: "created_at", visible: true },
  { id: "actions", header: "", accessor: "", visible: true },
];

export default function CompanyList() {
  const navigate = useNavigate();
  const { companies, companiesLoading, toggleCompanyStatus } = useSuperAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);

  const visibleColumns = columns.filter(col => col.visible);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.code.toLowerCase().includes(search.toLowerCase()) ||
        company.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && company.is_active) ||
        (statusFilter === "inactive" && !company.is_active);
      
      const matchesPlan = planFilter === "all" || 
        (company.subscription_plan || "free") === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [companies, search, statusFilter, planFilter]);

  // Sort companies
  const sortedCompanies = useMemo(() => {
    return [...filteredCompanies].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "code":
          aVal = a.code.toLowerCase();
          bVal = b.code.toLowerCase();
          break;
        case "email":
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case "subscription_plan":
          aVal = (a.subscription_plan || "free").toLowerCase();
          bVal = (b.subscription_plan || "free").toLowerCase();
          break;
        case "employee_count":
          aVal = a.employee_count || 0;
          bVal = b.employee_count || 0;
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCompanies, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedCompanies.length / pageSize);
  const paginatedCompanies = sortedCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible } : col
    ));
  };

  const handleExportCsv = () => {
    handleExport();
  };

  const handleRefresh = () => {
    // Trigger a refetch by invalidating the query
    window.location.reload();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCompanies.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleBulkAction = (action: "activate" | "deactivate") => {
    selectedIds.forEach(id => {
      toggleCompanyStatus({ id, isActive: action === "activate" });
    });
    setSelectedIds([]);
    toast.success(`${selectedIds.length} companies ${action === "activate" ? "activated" : "deactivated"}`);
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Code", "Email", "Plan", "Employees", "Status", "Created"],
      ...sortedCompanies.map(c => [
        c.name,
        c.code,
        c.email,
        c.subscription_plan || "free",
        c.employee_count || 0,
        c.is_active ? "Active" : "Inactive",
        format(new Date(c.created_at), "yyyy-MM-dd"),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Companies exported successfully");
  };

  // Get unique plans for filter
  const uniquePlans = [...new Set(companies.map(c => c.subscription_plan || "free"))];

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description="Manage all companies on the platform"
      >
        <Link to="/super-admin/companies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <DataTableToolbar
          columns={columns.filter(c => c.id !== "checkbox" && c.id !== "actions")}
          onToggleColumn={handleToggleColumn}
          onExport={handleExportCsv}
          onRefresh={handleRefresh}
          onAddRow={() => navigate("/super-admin/companies/new")}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={companiesLoading}
          addRowLabel="Add Company"
        />

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {uniquePlans.map(plan => (
                    <SelectItem key={plan} value={plan} className="capitalize">
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-4 border-b bg-primary/5">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
              Activate All
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
              Deactivate All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
          </div>
        )}
        <CardContent>
          {companiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : paginatedCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No companies found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== "all" || planFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Add your first company to get started"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.length === paginatedCompanies.length && paginatedCompanies.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground" 
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Company <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center">
                        Code <SortIcon field="code" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email <SortIcon field="email" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("subscription_plan")}
                    >
                      <div className="flex items-center">
                        Plan <SortIcon field="subscription_plan" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("employee_count")}
                    >
                      <div className="flex items-center">
                        Employees <SortIcon field="employee_count" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Created <SortIcon field="created_at" />
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(company.id)}
                          onCheckedChange={(checked) => handleSelectOne(company.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
                          <span className="font-medium truncate max-w-[150px]">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {company.code}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{company.email}</TableCell>
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
                              <Link to={`/super-admin/companies/${company.code}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/super-admin/companies/${company.code}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
              
              <div className="mt-4">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={sortedCompanies.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
