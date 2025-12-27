import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, CalendarCheck, Clock, CalendarX } from "lucide-react";
import { leaveRequests, leaveTypes, leaveBalances } from "@/data/mockData";
import { toast } from "sonner";

export default function EmployeeLeaves() {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Filter leaves for current employee
  const myLeaves = leaveRequests.filter((r) => r.employeeId === "emp-3");
  const pendingLeaves = myLeaves.filter((r) => r.status === "pending");
  const approvedLeaves = myLeaves.filter((r) => r.status === "approved");

  const handleApplyLeave = () => {
    toast.success("Leave request submitted successfully!");
    setIsApplyDialogOpen(false);
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const handleCancelLeave = (id: string) => {
    toast.success("Leave request cancelled");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "My Leaves" }]} />

      <PageHeader title="My Leaves" description="Apply for leaves and view your leave history">
        <Button onClick={() => setIsApplyDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Apply Leave
        </Button>
      </PageHeader>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {leaveBalances.map((balance) => {
          const type = leaveTypes.find((t) => t.id === balance.leaveTypeId);
          return (
            <Card key={balance.leaveTypeId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: type?.color }}
                  />
                  <span className="font-medium">{type?.name}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">{balance.available}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Used: {balance.used}</p>
                    <p>Total: {balance.total}</p>
                  </div>
                </div>
                {balance.pending > 0 && (
                  <p className="text-xs text-warning mt-2">
                    {balance.pending} pending approval
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingLeaves.length}</p>
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
              <p className="text-2xl font-semibold">{approvedLeaves.length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarX className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {leaveBalances.reduce((sum, b) => sum + b.used, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Days Used (YTD)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="all" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeaves.length > 0 ? myLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              leaveTypes.find((t) => t.id === leave.leaveTypeId)?.color,
                          }}
                        />
                        {leave.leaveTypeName}
                      </div>
                    </TableCell>
                    <TableCell>{leave.startDate}</TableCell>
                    <TableCell>{leave.endDate}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(leave.appliedOn).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={leave.status} />
                    </TableCell>
                    <TableCell>
                      {leave.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelLeave(leave.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves.length > 0 ? pendingLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.leaveTypeName}</TableCell>
                    <TableCell>{leave.startDate}</TableCell>
                    <TableCell>{leave.endDate}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>{leave.reason}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleCancelLeave(leave.id)}>
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No pending requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="approved" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedLeaves.length > 0 ? approvedLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.leaveTypeName}</TableCell>
                    <TableCell>{leave.startDate}</TableCell>
                    <TableCell>{leave.endDate}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>John Smith</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No approved leaves
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Card>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => {
                    const balance = leaveBalances.find((b) => b.leaveTypeId === type.id);
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name} ({balance?.available || 0} available)
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Please provide a reason for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyLeave}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
