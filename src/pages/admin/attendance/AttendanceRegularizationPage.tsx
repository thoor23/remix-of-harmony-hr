import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Check, X, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  useAllRegularizationRequests,
  useReviewRegularizationRequest,
} from "@/hooks/useAttendanceRegularization";
import { format } from "date-fns";

export default function AttendanceRegularizationPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [comments, setComments] = useState("");

  const { data: requests = [], isLoading } = useAllRegularizationRequests(statusFilter);
  const reviewMutation = useReviewRegularizationRequest();

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const approvedCount = requests.filter((r: any) => r.status === "approved").length;
  const rejectedCount = requests.filter((r: any) => r.status === "rejected").length;

  const handleReview = () => {
    if (!selectedRequest || !reviewAction) return;

    reviewMutation.mutate(
      {
        id: selectedRequest.id,
        status: reviewAction,
        review_comments: comments,
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setReviewAction(null);
          setComments("");
        },
      }
    );
  };

  const getEmployeeName = (request: any) => {
    if (request.employee?.profile) {
      const { first_name, last_name } = request.employee.profile;
      return `${first_name || ""} ${last_name || ""}`.trim() || request.employee.employee_id;
    }
    return request.employee?.employee_id || "Unknown";
  };

  const requestTypeLabels: Record<string, string> = {
    correction: "Time Correction",
    missing_entry: "Missing Entry",
    overtime: "Overtime Claim",
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Attendance Regularization"
          description="Review and manage attendance correction requests"
        />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Regularization"
        description="Review and manage attendance correction requests"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
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

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No regularization requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Original Time</TableHead>
                  <TableHead>Requested Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(request)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.request_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {requestTypeLabels[request.request_type] || request.request_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.original_check_in || "-"} - {request.original_check_out || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {request.requested_check_in || "-"} - {request.requested_check_out || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status as any} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction("approved");
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewAction("rejected");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setReviewAction(null);
          setComments("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction
                ? `${reviewAction === "approved" ? "Approve" : "Reject"} Request`
                : "Request Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee</p>
                  <p className="font-medium">{getEmployeeName(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.request_date), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Original Time</p>
                  <p className="p-2 bg-muted rounded">
                    {selectedRequest.original_check_in || "—"} to{" "}
                    {selectedRequest.original_check_out || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Time</p>
                  <p className="p-2 bg-primary/10 rounded font-medium">
                    {selectedRequest.requested_check_in || "—"} to{" "}
                    {selectedRequest.requested_check_out || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-sm mt-1">{selectedRequest.reason}</p>
              </div>

              {reviewAction && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Review Comments (Optional)
                  </p>
                  <Textarea
                    placeholder="Add any comments about this decision..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setReviewAction(null);
                setComments("");
              }}
            >
              Cancel
            </Button>
            {reviewAction && (
              <Button
                variant={reviewAction === "approved" ? "default" : "destructive"}
                onClick={handleReview}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending
                  ? "Processing..."
                  : reviewAction === "approved"
                  ? "Approve & Update Attendance"
                  : "Reject"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
