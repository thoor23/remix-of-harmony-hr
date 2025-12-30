import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { Clock, CheckCircle, XCircle, ArrowUpDown, Search, X } from "lucide-react";
import { useMyProfileChangeRequests } from "@/hooks/useProfileChangeRequests";
import { format } from "date-fns";

const fieldOptions = [
  { value: "phone", label: "Phone Number" },
  { value: "address_street", label: "Street Address" },
  { value: "address_city", label: "City" },
  { value: "address_state", label: "State" },
  { value: "address_zip_code", label: "Zip Code" },
  { value: "emergency_contact_name", label: "Emergency Contact Name" },
  { value: "emergency_contact_phone", label: "Emergency Contact Phone" },
  { value: "bank_name", label: "Bank Name" },
  { value: "bank_account_number", label: "Bank Account Number" },
  { value: "bank_ifsc_code", label: "Bank IFSC Code" },
];

const getFieldLabel = (fieldName: string) => {
  return fieldOptions.find(f => f.value === fieldName)?.label || fieldName;
};

const defaultColumns: ColumnDef[] = [
  { id: "field_name", header: "Field", accessor: "field_name", visible: true },
  { id: "current_value", header: "Current Value", accessor: "current_value", visible: true },
  { id: "new_value", header: "New Value", accessor: "new_value", visible: true },
  { id: "reason", header: "Reason", accessor: "reason", visible: true },
  { id: "created_at", header: "Submitted On", accessor: "created_at", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "review_comments", header: "Review Comments", accessor: "review_comments", visible: false },
];

export default function ProfileChangeRequests() {
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: changeRequests = [], isLoading, refetch } = useMyProfileChangeRequests();

  const hasActiveFilters = statusFilter !== "all" || searchQuery;

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  const filteredRequests = useMemo(() => {
    let data = [...changeRequests];
    
    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }
    
    if (searchQuery) {
      data = data.filter((r) => 
        getFieldLabel(r.field_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.new_value?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return data;
  }, [changeRequests, statusFilter, searchQuery]);

  const sortedRequests = useMemo(() => {
    if (!sortConfig) return filteredRequests;
    return [...filteredRequests].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRequests, defaultPageSize: 10 });

  const pendingCount = changeRequests.filter((r) => r.status === "pending").length;
  const approvedCount = changeRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = changeRequests.filter((r) => r.status === "rejected").length;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible } : col))
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? sortedRequests.filter((r) => selectedRows.has(r.id))
      : sortedRequests;
    
    const exportData = dataToExport.map((r) => ({
      ...r,
      field_name: getFieldLabel(r.field_name),
      created_at: format(new Date(r.created_at), "MMM dd, yyyy"),
    }));
    exportToCSV(exportData, columns, "profile-change-requests");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Change Requests" description="View your profile change requests and their status" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Card>
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <PageContainer>
      <PageHeader title="My Change Requests" description="View your profile change requests and their status" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={() => refetch()}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={isLoading}
        />

        {showFilters && (
          <div className="p-4 border-b bg-muted/30 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by field, value, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1.5">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((r) => selectedRows.has(r.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort(col.id)}
                  >
                    {col.header}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? paginatedData.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(request.id)}
                    onCheckedChange={(checked) => handleSelectRow(request.id, checked as boolean)}
                  />
                </TableCell>
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    {col.id === "field_name" ? (
                      <span className="font-medium">{getFieldLabel(request.field_name)}</span>
                    ) : col.id === "status" ? (
                      getStatusBadge(request.status)
                    ) : col.id === "created_at" ? (
                      format(new Date(request.created_at), "MMM dd, yyyy")
                    ) : col.id === "current_value" ? (
                      <span className="text-muted-foreground">{request.current_value || "N/A"}</span>
                    ) : col.id === "new_value" ? (
                      <span className="font-medium">{request.new_value}</span>
                    ) : col.id === "reason" ? (
                      <span className="text-sm">{request.reason || "-"}</span>
                    ) : col.id === "review_comments" ? (
                      <span className="text-sm">{request.review_comments || "-"}</span>
                    ) : (
                      request[col.accessor as keyof typeof request] || "-"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    <p>No change requests found</p>
                    <p className="text-sm mt-1">Go to your Profile page to request changes</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </PageContainer>
  );
}
