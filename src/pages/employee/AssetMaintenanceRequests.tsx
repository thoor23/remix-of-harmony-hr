import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Search, AlertCircle, X, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useMyAssets } from "@/hooks/useMyAssets";
import { useMyMaintenanceRequests, useCreateMaintenanceRequest, useCancelMaintenanceRequest } from "@/hooks/useMaintenanceRequests";
import { format } from "date-fns";
import { toast } from "sonner";
import { MaintenanceRequestPriority, MaintenanceRequestType, MaintenanceRequestStatus } from "@/types/asset";

const requestStatusColors: Record<MaintenanceRequestStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-info/10 text-info border-info/20",
  on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<MaintenanceRequestPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/10 text-info border-info/20",
  high: "bg-warning/10 text-warning border-warning/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function EmployeeAssetMaintenanceRequests() {
  const { data: assets = [], isLoading: assetsLoading } = useMyAssets();
  const { data: maintenanceRequests = [], isLoading: requestsLoading } = useMyMaintenanceRequests();
  const createRequest = useCreateMaintenanceRequest();
  const cancelRequest = useCancelMaintenanceRequest();

  const isLoading = assetsLoading || requestsLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Maintenance request dialog
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({
    asset_id: "",
    type: "repair" as MaintenanceRequestType,
    priority: "medium" as MaintenanceRequestPriority,
    description: "",
  });

  const hasActiveFilters = searchQuery || statusFilter !== "all" || priorityFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    let data = [...maintenanceRequests];
    
    if (searchQuery) {
      data = data.filter(
        (r) =>
          r.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.asset?.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      data = data.filter((r) => r.priority === priorityFilter);
    }

    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [maintenanceRequests, searchQuery, statusFilter, priorityFilter]);

  const handleSubmitRequest = async () => {
    if (!requestForm.asset_id || !requestForm.description) {
      toast.error("Please select an asset and provide a description");
      return;
    }

    await createRequest.mutateAsync({
      asset_id: requestForm.asset_id,
      type: requestForm.type,
      priority: requestForm.priority,
      description: requestForm.description,
    });

    setShowRequestDialog(false);
    setRequestForm({
      asset_id: "",
      type: "repair",
      priority: "medium",
      description: "",
    });
  };

  const handleCancelRequest = async (id: string) => {
    await cancelRequest.mutateAsync(id);
  };

  const formatStatusLabel = (status: MaintenanceRequestStatus) => {
    const labels: Record<MaintenanceRequestStatus, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      scheduled: "Scheduled",
      in_progress: "In Progress",
      on_hold: "On Hold",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  // Stats
  const totalRequests = maintenanceRequests.length;
  const pendingRequests = maintenanceRequests.filter(r => r.status === 'pending').length;
  const activeRequests = maintenanceRequests.filter(r => ['approved', 'scheduled', 'in_progress'].includes(r.status)).length;
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed').length;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Maintenance Requests" description="Submit and track maintenance requests for your assets" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Maintenance Requests" description="Submit and track maintenance requests for your assets">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/employee/assets">
              <Package className="mr-2 h-4 w-4" />
              My Assets
            </Link>
          </Button>
          <Button onClick={() => setShowRequestDialog(true)} disabled={assets.length === 0}>
            <Wrench className="mr-2 h-4 w-4" />
            Request Maintenance
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalRequests}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingRequests}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeRequests}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{completedRequests}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by asset or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
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

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>{maintenanceRequests.length === 0 ? "No maintenance requests yet" : "No requests matching your filters"}</p>
            {maintenanceRequests.length === 0 && (
              <p className="text-sm">Submit a request when you need asset maintenance</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.asset?.name || "-"}
                    {request.asset?.asset_tag && (
                      <span className="block text-xs text-muted-foreground font-mono">
                        {request.asset.asset_tag}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[request.priority]}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {request.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={requestStatusColors[request.status]}>
                      {formatStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(request.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={cancelRequest.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    )}
                    {request.review_comments && request.status !== 'pending' && (
                      <span className="text-xs text-muted-foreground block max-w-[100px] truncate" title={request.review_comments}>
                        {request.review_comments}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Maintenance Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Maintenance</DialogTitle>
            <DialogDescription>
              Submit a maintenance request for one of your assigned assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset *</Label>
              <Select
                value={requestForm.asset_id}
                onValueChange={(value) => setRequestForm({ ...requestForm, asset_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={requestForm.type}
                  onValueChange={(value) => setRequestForm({ ...requestForm, type: value as MaintenanceRequestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select
                  value={requestForm.priority}
                  onValueChange={(value) => setRequestForm({ ...requestForm, priority: value as MaintenanceRequestPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the issue or maintenance needed (e.g., 'Windows not booting, showing blue screen error')"
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!requestForm.asset_id || !requestForm.description || createRequest.isPending}
            >
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
