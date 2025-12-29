import { useState, useMemo, Fragment } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Clock, User, Globe, FileText, Database, CalendarIcon, X } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const actionColors: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-warning/10 text-warning",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-info/10 text-info",
  LOGOUT: "bg-muted text-muted-foreground",
};

interface AuditLogsPageProps {
  module?: string;
  title: string;
  description: string;
}

export default function AuditLogsPage({ module, title, description }: AuditLogsPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [performerFilter, setPerformerFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
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
    { id: "module", header: "Module", visible: !module }, // Hide module column when viewing module-specific logs
    { id: "description", header: "Description", visible: true },
    { id: "performer_name", header: "Performed By", visible: true },
    { id: "ip_address", header: "IP Address", visible: true },
  ]);

  const { data: logs = [], isLoading, isFetching } = useAuditLogs({
    search: search || undefined,
    action: action !== "all" ? action : undefined,
    module: moduleFilter !== "all" ? moduleFilter : (module || undefined),
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  });

  // Extract unique performers for filter dropdown
  const uniquePerformers = useMemo(() => {
    return [...new Set(logs.map(l => l.performer_name).filter(Boolean))].sort() as string[];
  }, [logs]);

  // Apply client-side performer filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (performerFilter !== "all" && log.performer_name !== performerFilter) return false;
      return true;
    });
  }, [logs, performerFilter]);

  const hasActiveFilters = search || action !== "all" || performerFilter !== "all" || moduleFilter !== "all" || dateRange;

  const handleClearFilters = () => {
    setSearch("");
    setAction("all");
    setPerformerFilter("all");
    setModuleFilter("all");
    setDateRange(undefined);
  };

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let aVal: any, bVal: any;
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
        case "ip_address":
          aVal = a.ip_address || "";
          bVal = b.ip_address || "";
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLogs, sortColumn, sortDirection]);

  const pagination = usePagination({ data: sortedLogs, defaultPageSize: 10 });
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
      ip_address: log.ip_address || "-",
    }));
    const filename = module ? `audit-logs-${module.toLowerCase()}` : "audit-logs";
    exportToCSV(data, columns, filename);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const visibleColumnCount = columns.filter(c => c.visible).length + 2; // +1 for checkbox, +1 for expand button

  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
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
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Performer Filter */}
              <Select value={performerFilter} onValueChange={setPerformerFilter}>
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Performer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performers</SelectItem>
                  {uniquePerformers.map((performer) => (
                    <SelectItem key={performer} value={performer}>{performer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Module Filter (only when not viewing module-specific logs) */}
              {!module && (
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-full lg:w-36">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Attendance">Attendance</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                    <SelectItem value="Shift">Shift</SelectItem>
                    <SelectItem value="Payroll">Payroll</SelectItem>
                    <SelectItem value="Asset">Asset</SelectItem>
                    <SelectItem value="Helpdesk">Helpdesk</SelectItem>
                    <SelectItem value="Documents">Documents</SelectItem>
                    <SelectItem value="Letters">Letters</SelectItem>
                    <SelectItem value="Announcement">Announcement</SelectItem>
                    <SelectItem value="Templates">Templates</SelectItem>
                    <SelectItem value="Settings">Settings</SelectItem>
                    <SelectItem value="Auth">Auth</SelectItem>
                    <SelectItem value="Departments">Departments</SelectItem>
                    <SelectItem value="Designations">Designations</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
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
                  <TableHead className="w-10"></TableHead>
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
                  {columns.find(c => c.id === "ip_address")?.visible && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort("ip_address")}>
                      <div className="flex items-center">IP Address {getSortIcon("ip_address")}</div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center text-muted-foreground py-8">
                      No audit logs found
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
                          onClick={() => handleToggleExpand(log.id)}
                        >
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(log.id);
                              }}
                            >
                              <ChevronRight 
                                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                              />
                            </Button>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedRows.includes(log.id)}
                              onCheckedChange={(checked) => handleSelectRow(log.id, !!checked)}
                            />
                          </TableCell>
                          {columns.find(c => c.id === "created_at")?.visible && (
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "action")?.visible && (
                            <TableCell>
                              <Badge className={actionColors[log.action] || "bg-muted"}>
                                {log.action}
                              </Badge>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "module")?.visible && (
                            <TableCell>
                              <Badge variant="outline">{log.module}</Badge>
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "description")?.visible && (
                            <TableCell className="max-w-xs truncate">
                              {log.description}
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "performer_name")?.visible && (
                            <TableCell className="font-medium">
                              {log.performer_name || "System"}
                            </TableCell>
                          )}
                          {columns.find(c => c.id === "ip_address")?.visible && (
                            <TableCell className="text-muted-foreground">
                              {log.ip_address || "-"}
                            </TableCell>
                          )}
                        </TableRow>
                        
                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={visibleColumnCount} className="p-0">
                              <div className="px-6 py-4 space-y-4">
                                <div className="text-sm font-medium text-foreground mb-3">Event Details</div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Timestamp Details */}
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">Timestamp</div>
                                      <div className="text-sm font-medium">
                                        {format(new Date(log.created_at), "EEEE, MMMM d, yyyy")}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(new Date(log.created_at), "h:mm:ss a")}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Performer Details */}
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">Performed By</div>
                                      <div className="text-sm font-medium">
                                        {log.performer_name || "System"}
                                      </div>
                                      {log.performed_by && (
                                        <div className="text-xs text-muted-foreground font-mono">
                                          ID: {log.performed_by.slice(0, 8)}...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* IP Address Details */}
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">IP Address</div>
                                      <div className="text-sm font-medium font-mono">
                                        {log.ip_address || "Not recorded"}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Module & Action */}
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-xs text-muted-foreground font-medium">Module / Action</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{log.module}</Badge>
                                        <Badge className={`text-xs ${actionColors[log.action] || "bg-muted"}`}>
                                          {log.action}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Description */}
                                <div className="p-3 rounded-lg bg-background border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground font-medium">Description</span>
                                  </div>
                                  <p className="text-sm">{log.description}</p>
                                </div>
                                
                                {/* Metadata */}
                                {hasMetadata && (
                                  <div className="p-3 rounded-lg bg-background border">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Database className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground font-medium">Additional Data</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      {Object.entries(metadata).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                                          <span className="font-medium">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Event ID */}
                                <div className="text-xs text-muted-foreground">
                                  Event ID: <span className="font-mono">{log.id}</span>
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
          </CardContent>
        )}

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
