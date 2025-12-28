import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Check, X, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAllProfileChangeRequests, useReviewProfileChangeRequest } from "@/hooks/useProfileChangeRequests";
import { format } from "date-fns";

export default function ProfileChangeRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [comments, setComments] = useState("");

  const { data: requests = [], isLoading } = useAllProfileChangeRequests();
  const reviewMutation = useReviewProfileChangeRequest();

  const pendingRequests = requests.filter((r: any) => r.status === "pending");
  const reviewedRequests = requests.filter((r: any) => r.status !== "pending");

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

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Profile Change Requests" description="Review and manage employee profile update requests" />
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
      <PageHeader title="Profile Change Requests" description="Review and manage employee profile update requests" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
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
              <p className="text-2xl font-semibold">
                {requests.filter((r: any) => r.status === "approved").length}
              </p>
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
              <p className="text-2xl font-semibold">
                {requests.filter((r: any) => r.status === "rejected").length}
              </p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.employee?.employee_id || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatFieldName(request.field_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {request.current_value || "-"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate font-medium text-primary">
                          {request.new_value}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {request.reason || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), "MMM d, yyyy")}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewed">
          <Card>
            <CardContent className="p-0">
              {reviewedRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No reviewed requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Requested Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed On</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewedRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.employee?.employee_id || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatFieldName(request.field_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {request.new_value}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status as any} />
                        </TableCell>
                        <TableCell>
                          {request.reviewed_at
                            ? format(new Date(request.reviewed_at), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {request.review_comments || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <p className="font-medium">{selectedRequest.employee?.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Field</p>
                  <p className="font-medium">{formatFieldName(selectedRequest.field_name)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                  <p className="p-2 bg-muted rounded">{selectedRequest.current_value || "Empty"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Value</p>
                  <p className="p-2 bg-primary/10 rounded font-medium">{selectedRequest.new_value}</p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}

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
                  ? "Approve"
                  : "Reject"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
