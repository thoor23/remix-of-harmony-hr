import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, CalendarCheck, Clock, CalendarX } from "lucide-react";
import { useLeaveRequests, useLeaveTypes, useUpdateLeaveRequest, LeaveRequestWithDetails } from "@/hooks/useLeaves";
import { format } from "date-fns";

export default function LeaveManagement() {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");

  const { data: leaveRequests = [], isLoading } = useLeaveRequests();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const updateLeaveRequest = useUpdateLeaveRequest();

  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved");
  const rejectedRequests = leaveRequests.filter((r) => r.status === "rejected");

  const handleAction = (request: LeaveRequestWithDetails, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setComments("");
  };

  const confirmAction = () => {
    if (selectedRequest && actionType) {
      updateLeaveRequest.mutate({
        id: selectedRequest.id,
        status: actionType === "approve" ? "approved" : "rejected",
        comments: comments || undefined,
      });
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const getEmployeeName = (request: LeaveRequestWithDetails) => {
    const profile = request.employee?.profile;
    if (!profile) return "Unknown";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";
  };

  const getEmployeeInitials = (request: LeaveRequestWithDetails) => {
    const profile = request.employee?.profile;
    if (!profile) return "??";
    return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "??";
  };

  const renderRequestTable = (requests: LeaveRequestWithDetails[], showActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Applied On</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={request.employee?.profile?.avatar_url || undefined} />
                  <AvatarFallback>{getEmployeeInitials(request)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{getEmployeeName(request)}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: request.leave_type?.color || "#888" }}
                />
                {request.leave_type?.name || "Unknown"}
              </span>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>{format(new Date(request.start_date), "MMM dd, yyyy")}</p>
                <p className="text-muted-foreground">to {format(new Date(request.end_date), "MMM dd, yyyy")}</p>
              </div>
            </TableCell>
            <TableCell>{request.days}</TableCell>
            <TableCell className="max-w-xs truncate">{request.reason || "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(request.created_at), "MMM dd, yyyy")}
            </TableCell>
            <TableCell>
              <StatusBadge status={request.status as "pending" | "approved" | "rejected"} />
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAction(request, "reject")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAction(request, "approve")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
        {requests.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={showActions ? 8 : 7}
              className="text-center text-muted-foreground py-8"
            >
              No requests found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Leave Management" description="Review and manage employee leave requests" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
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
      <PageHeader
        title="Leave Management"
        description="Review and manage employee leave requests"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{approvedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CalendarX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{rejectedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingRequests.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="pending" className="m-0">
            {renderRequestTable(pendingRequests, true)}
          </TabsContent>
          <TabsContent value="approved" className="m-0">
            {renderRequestTable(approvedRequests)}
          </TabsContent>
          <TabsContent value="rejected" className="m-0">
            {renderRequestTable(rejectedRequests)}
          </TabsContent>
          <TabsContent value="all" className="m-0">
            {renderRequestTable(leaveRequests)}
          </TabsContent>
        </Card>
      </Tabs>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this leave request?"
                : "Please provide a reason for rejecting this leave request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedRequest.employee?.profile?.avatar_url || undefined} />
                  <AvatarFallback>{getEmployeeInitials(selectedRequest)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getEmployeeName(selectedRequest)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.leave_type?.name || "Leave"} • {selectedRequest.days} days
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">{format(new Date(selectedRequest.start_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p className="font-medium">{format(new Date(selectedRequest.end_date), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedRequest.reason || "No reason provided"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Comments {actionType === "reject" && "(required)"}
                </p>
                <Textarea
                  placeholder="Add your comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={actionType === "reject" && !comments || updateLeaveRequest.isPending}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
