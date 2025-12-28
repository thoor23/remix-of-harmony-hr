import { useState } from "react";
import { format } from "date-fns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
} from "lucide-react";
import {
  useShiftExchangeRequests,
  useCreateShiftExchangeRequest,
  useUpdateShiftExchangeRequest,
  type ShiftExchangeRequest,
} from "@/hooks/useShiftExchange";
import { useShiftAssignments, useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function ShiftExchange() {
  const { data: exchanges = [], isLoading } = useShiftExchangeRequests();
  const { data: shiftAssignments = [] } = useShiftAssignments();
  const { data: shifts = [] } = useShifts();
  const { data: employees = [] } = useEmployees();
  const createExchange = useCreateShiftExchangeRequest();
  const updateExchange = useUpdateShiftExchangeRequest();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ShiftExchangeRequest | null>(null);
  const [responseAction, setResponseAction] = useState<"approve" | "reject">("approve");
  const [responseNote, setResponseNote] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    requesterId: "",
    targetEmployeeId: "",
    requestDate: "",
    reason: "",
  });

  // Helper to get employee name
  const getEmployeeName = (exchange: ShiftExchangeRequest, type: "requester" | "target") => {
    const emp = type === "requester" ? exchange.requester : exchange.target_employee;
    if (emp?.profile?.first_name || emp?.profile?.last_name) {
      return `${emp.profile.first_name || ""} ${emp.profile.last_name || ""}`.trim();
    }
    return emp?.employee_id || "Unknown";
  };

  const filteredExchanges = exchanges.filter((exchange) => {
    const requesterName = getEmployeeName(exchange, "requester");
    const targetName = getEmployeeName(exchange, "target");
    const matchesSearch =
      requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exchange.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: exchanges.length,
    pending: exchanges.filter((e) => e.status === "pending").length,
    approved: exchanges.filter((e) => e.status === "approved").length,
    rejected: exchanges.filter((e) => e.status === "rejected").length,
  };

  // Get shift assignment for an employee
  const getEmployeeAssignment = (employeeId: string) => {
    return shiftAssignments.find((a) => a.employee_id === employeeId && a.is_active);
  };

  // Get shift by id
  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId);
  };

  // Get available employees with their shifts
  const employeesWithShifts = employees.map((emp) => {
    const assignment = getEmployeeAssignment(emp.id);
    const shift = assignment ? getShift(assignment.shift_id) : null;
    const name = emp.first_name || emp.last_name
      ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
      : emp.employee_id;
    return {
      id: emp.id,
      name,
      shiftId: shift?.id,
      shiftName: shift?.name || "No Shift",
    };
  }).filter((e) => e.shiftId);

  const handleCreateExchange = () => {
    const requesterAssignment = getEmployeeAssignment(formData.requesterId);
    const targetAssignment = getEmployeeAssignment(formData.targetEmployeeId);

    if (!requesterAssignment || !targetAssignment) {
      return;
    }

    createExchange.mutate(
      {
        requester_id: formData.requesterId,
        target_employee_id: formData.targetEmployeeId,
        requester_shift_id: requesterAssignment.shift_id,
        target_shift_id: targetAssignment.shift_id,
        request_date: formData.requestDate,
        reason: formData.reason,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ requesterId: "", targetEmployeeId: "", requestDate: "", reason: "" });
        },
      }
    );
  };

  const handleResponse = () => {
    if (!selectedExchange) return;

    updateExchange.mutate(
      {
        id: selectedExchange.id,
        status: responseAction === "approve" ? "approved" : "rejected",
        response_note: responseNote,
      },
      {
        onSuccess: () => {
          setIsResponseOpen(false);
          setResponseNote("");
          setSelectedExchange(null);
        },
      }
    );
  };

  const openResponseDialog = (exchange: ShiftExchangeRequest, action: "approve" | "reject") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsResponseOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shift Exchange Requests</h1>
          <p className="text-muted-foreground">Manage employee shift swap requests</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Total Requests" value={stats.total} icon={ArrowLeftRight} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead className="text-center">Exchange</TableHead>
                <TableHead>Target Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExchanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No exchange requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExchanges.map((exchange) => {
                  const StatusIcon = statusConfig[exchange.status]?.icon || Clock;
                  return (
                    <TableRow key={exchange.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{getEmployeeName(exchange, "requester")}</span>
                          {exchange.requester_shift && (
                            <ShiftBadge
                              name={exchange.requester_shift.name}
                              color={exchange.requester_shift.color || "#3B82F6"}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{getEmployeeName(exchange, "target")}</span>
                          {exchange.target_shift && (
                            <ShiftBadge
                              name={exchange.target_shift.name}
                              color={exchange.target_shift.color || "#3B82F6"}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(exchange.request_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusConfig[exchange.status]?.className || ""
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig[exchange.status]?.label || exchange.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedExchange(exchange);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {exchange.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => openResponseDialog(exchange, "approve")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openResponseDialog(exchange, "reject")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Requesting Employee</label>
              <Select
                value={formData.requesterId}
                onValueChange={(value) => setFormData({ ...formData, requesterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithShifts.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.shiftName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Employee</label>
              <Select
                value={formData.targetEmployeeId}
                onValueChange={(value) => setFormData({ ...formData, targetEmployeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to swap with" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithShifts
                    .filter((e) => e.id !== formData.requesterId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.shiftName})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange Date</label>
              <Input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Reason for exchange..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateExchange}
              disabled={!formData.requesterId || !formData.targetEmployeeId || !formData.requestDate || createExchange.isPending}
            >
              {createExchange.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exchange Request Details</DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="font-medium">{getEmployeeName(selectedExchange, "requester")}</p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge
                      name={selectedExchange.requester_shift.name}
                      color={selectedExchange.requester_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">{getEmployeeName(selectedExchange, "target")}</p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge
                      name={selectedExchange.target_shift.name}
                      color={selectedExchange.target_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Exchange Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedExchange.request_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusConfig[selectedExchange.status]?.className || ""
                    }`}
                  >
                    {statusConfig[selectedExchange.status]?.label || selectedExchange.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested On</p>
                  <p className="font-medium">
                    {format(new Date(selectedExchange.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                {selectedExchange.responded_at && (
                  <div>
                    <p className="text-muted-foreground">Responded On</p>
                    <p className="font-medium">
                      {format(new Date(selectedExchange.responded_at), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {selectedExchange.reason && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Reason</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedExchange.reason}</p>
                </div>
              )}

              {selectedExchange.response_note && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Response Note</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedExchange.response_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseAction === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium">{getEmployeeName(selectedExchange, "requester")}</p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge
                      name={selectedExchange.requester_shift.name}
                      color={selectedExchange.requester_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">{getEmployeeName(selectedExchange, "target")}</p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge
                      name={selectedExchange.target_shift.name}
                      color={selectedExchange.target_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Response Note (optional)</label>
                <Textarea
                  placeholder="Add a note..."
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={responseAction === "approve" ? "default" : "destructive"}
              onClick={handleResponse}
              disabled={updateExchange.isPending}
            >
              {updateExchange.isPending
                ? "Processing..."
                : responseAction === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
