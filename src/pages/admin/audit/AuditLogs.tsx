import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { useQueryClient } from "@tanstack/react-query";

const actionColors: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-warning/10 text-warning",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-info/10 text-info",
  LOGOUT: "bg-muted text-muted-foreground",
};

const modules = ["Employee", "Leave", "Payroll", "Announcement", "Settings", "Auth", "Documents", "Departments", "Designations"];

export default function AuditLogs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [module, setModule] = useState("all");
  const [showFilter, setShowFilter] = useState(true);
  
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
  ]);

  const { data: logs = [], isLoading, isFetching } = useAuditLogs({
    search: search || undefined,
    action: action !== "all" ? action : undefined,
    module: module !== "all" ? module : undefined,
  });

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
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
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, sortColumn, sortDirection]);

  const { paginatedItems, ...pagination } = usePagination(sortedLogs, { defaultPageSize: 10 });

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

  const handleExport = () => {
    const data = sortedLogs.map(log => ({
      created_at: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      action: log.action,
      module: log.module,
      description: log.description,
      performer_name: log.performer_name || "System",
    }));
    exportToCSV(data, columns, "audit-logs");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs"
        description="Track all system activities and changes"
      />

      {/* Logs Table */}
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full md:w-40">
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
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((mod) => (
                    <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((log) => (
                    <TableRow key={log.id} data-state={selectedRows.includes(log.id) ? "selected" : undefined}>
                      <TableCell>
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
                    </TableRow>
                  ))
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
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
