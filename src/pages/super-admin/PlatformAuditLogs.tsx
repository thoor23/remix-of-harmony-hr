import { useState, useMemo, Fragment } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Building2,
  Shield,
  Clock,
  User,
  FileText,
  Database,
  CalendarIcon,
  X,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  performer_name: string | null;
  company_id: string | null;
  company_name?: string;
  metadata: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success",
  CREATE: "bg-success/10 text-success",
  update: "bg-warning/10 text-warning",
  UPDATE: "bg-warning/10 text-warning",
  delete: "bg-destructive/10 text-destructive",
  DELETE: "bg-destructive/10 text-destructive",
  login: "bg-info/10 text-info",
  LOGIN: "bg-info/10 text-info",
  logout: "bg-muted text-muted-foreground",
  LOGOUT: "bg-muted text-muted-foreground",
};

export default function PlatformAuditLogs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilter, setShowFilter] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Table state
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "created_at", header: "Timestamp", visible: true },
    { id: "action", header: "Action", visible: true },
    { id: "module", header: "Module", visible: true },
    { id: "description", header: "Description", visible: true },
    { id: "performer_name", header: "Performed By", visible: true },
    { id: "company_name", header: "Company", visible: true },
  ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["platform-audit-logs", moduleFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          id, action, module, description, performer_name,
          company_id, metadata, ip_address, created_at,
          companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (moduleFilter !== "all") {
        query = query.eq('module', moduleFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq('action', actionFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(log => ({
        ...log,
        company_name: (log.companies as any)?.name || null,
      })) as unknown as AuditLog[];
    },
  });

  const logs = data || [];

  // Extract unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    return [...new Set(logs.map(l => l.company_name).filter(Boolean))].sort() as string[];
  }, [logs]);

  // Apply client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !log.description.toLowerCase().includes(searchLower) &&
          !log.performer_name?.toLowerCase().includes(searchLower) &&
          !log.module.toLowerCase().includes(searchLower) &&
          !log.company_name?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      // Company filter
      if (companyFilter !== "all" && log.company_name !== companyFilter) return false;
      // Date range filter
      if (dateRange?.from) {
        const logDate = new Date(log.created_at);
        if (logDate < dateRange.from) return false;
        if (dateRange.to && logDate > dateRange.to) return false;
      }
      return true;
    });
  }, [logs, search, companyFilter, dateRange]);

  const hasActiveFilters = search || actionFilter !== "all" || moduleFilter !== "all" || companyFilter !== "all" || dateRange;

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setModuleFilter("all");
    setCompanyFilter("all");
    setDateRange(undefined);
  };

  // Sorting
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      switch (sortColumn) {
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "action":
          aVal = a.action;
          bVal = b.action;
          break;
        case "module":
          aVal = a.module;
          bVal = b.module;
          break;
        case "description":
          aVal = a.description;
          bVal = b.description;
          break;
        case "performer_name":
          aVal = a.performer_name || "";
          bVal = b.performer_name || "";
          break;
        case "company_name":
          aVal = a.company_name || "";
          bVal = b.company_name || "";
          break;
        default:
          return 0;
      }
      if ((aVal as number) < (bVal as number)) return sortDirection === "asc" ? -1 : 1;
      if ((aVal as number) > (bVal as number)) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLogs, sortColumn, sortDirection]);

  const pagination = usePagination({ data: sortedLogs, defaultPageSize: 20 });
  const paginatedItems = pagination.paginatedData;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedItems.map((l) => l.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const data = sortedLogs.map(log => ({
      created_at: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      action: log.action,
      module: log.module,
      description: log.description,
      performer_name: log.performer_name || "System",
      company_name: log.company_name || "Platform",
    }));
    exportToCSV(data, columns, "platform-audit-logs");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-audit-logs"] });
  };

  const visibleColumnCount = columns.filter(c => c.visible).length + 1; // +1 for checkbox

  return (
    <PageContainer>
      <PageHeader
        title="Platform Audit Logs"
        description="Track all platform-wide activities and changes"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
        />

        {showFilter && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full lg:w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Module Filter */}
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Company Filter */}
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {uniqueCompanies.map((company) => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearFilters} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {columns.find(c => c.id === "created_at")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center">Timestamp {getSortIcon("created_at")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "action")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("action")}>
                      <div className="flex items-center">Action {getSortIcon("action")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "module")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("module")}>
                      <div className="flex items-center">Module {getSortIcon("module")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "description")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                      <div className="flex items-center">Description {getSortIcon("description")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "performer_name")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("performer_name")}>
                      <div className="flex items-center">Performed By {getSortIcon("performer_name")}</div>
                    </TableHead>
                  )}
                  {columns.find(c => c.id === "company_name")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("company_name")}>
                      <div className="flex items-center">Company {getSortIcon("company_name")}</div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-12">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No audit logs found</h3>
                      <p className="text-muted-foreground">
                        {hasActiveFilters ? "Try adjusting your filters" : "No activity has been logged yet"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((log) => {
                    const isExpanded = expandedRows.includes(log.id);
                    const metadata = log.metadata as Record<string, unknown>;
                    const hasMetadata = metadata && Object.keys(metadata).length > 0;
                    
                    return (
                      <Fragment key={log.id}>
                        <TableRow 
                          data-state={selectedRows.includes(log.id) ? "selected" : undefined}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => hasMetadata && handleToggleExpand(log.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedRows.includes(log.id)}
                              onCheckedChange={(checked) => handleSelectRow(log.id, !!checked)}
                            />
                          </TableCell>
                          {columns.find(c => c.id === "created_at")?.visible && (
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {hasMetadata && (
                                  <ChevronRight className={cn(
                                    "h-4 w-4 transition-transform",
                                    isExpanded && "rotate-90"
                                  )} />
                                )}
                                <Clock className="h-4 w-4" />
                                {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                              </div>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "action")?.visible && (
                            <TableCell>
                              <Badge className={actionColors[log.action] || "bg-muted"}>
                                {log.action.toUpperCase()}
                              </Badge>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "module")?.visible && (
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                {log.module}
                              </code>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "description")?.visible && (
                            <TableCell className="max-w-xs truncate">
                              {log.description}
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "performer_name")?.visible && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{log.performer_name || "System"}</span>
                              </div>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "company_name")?.visible && (
                            <TableCell>
                              {log.company_name ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{log.company_name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Platform</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                        
                        {/* Expanded Row - Metadata Details */}
                        {isExpanded && hasMetadata && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={visibleColumnCount} className="py-4">
                              <div className="pl-10 space-y-3">
                                <h4 className="font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Metadata Details
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {Object.entries(metadata).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {key.replace(/_/g, " ")}
                                      </p>
                                      <p className="text-sm font-medium break-all">
                                        {typeof value === "object" 
                                          ? JSON.stringify(value) 
                                          : String(value)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            <div className="border-t p-4">
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={sortedLogs.length}
                onPageChange={pagination.setCurrentPage}
                onPageSizeChange={pagination.setPageSize}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </PageContainer>
  );
}
