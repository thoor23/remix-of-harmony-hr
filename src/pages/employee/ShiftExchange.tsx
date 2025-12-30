import { useState } from "react";
import { format } from "date-fns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  Eye,
  User,
  AlertCircle,
  Inbox,
  Send,
  Check,
  X,
} from "lucide-react";
import {
  useMyShiftExchangeRequests,
  useCreateShiftExchangeRequest,
  useUpdateShiftExchangeRequest,
  useCancelShiftExchangeRequest,
  type ShiftExchangeRequest,
} from "@/hooks/useShiftExchange";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyShiftAssignment, useShiftAssignments, useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function EmployeeShiftExchange() {
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee();
  const { data: myShiftAssignments = [] } = useMyShiftAssignment(currentEmployee?.id);
  const { data: allExchanges = [], isLoading: isLoadingExchanges } = useMyShiftExchangeRequests(currentEmployee?.id);
  const { data: shiftAssignments = [] } = useShiftAssignments();
  const { data: shifts = [] } = useShifts();
  const { data: employees = [] } = useEmployees();
  
  // Get the first active assignment (current shift)
  const myShiftAssignment = Array.isArray(myShiftAssignments) ? myShiftAssignments[0] : myShiftAssignments;
  
  const createExchange = useCreateShiftExchangeRequest();
  const updateExchange = useUpdateShiftExchangeRequest();
  const cancelExchange = useCancelShiftExchangeRequest();

  // Filter exchanges
  const myRequests = allExchanges.filter((e) => e.requester_id === currentEmployee?.id);
  const incomingRequests = allExchanges.filter(
    (e) => e.target_employee_id === currentEmployee?.id && e.status === "pending"
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ShiftExchangeRequest | null>(null);
  const [responseAction, setResponseAction] = useState<"accept" | "decline">("accept");
  const [responseNote, setResponseNote] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    targetEmployeeId: "",
    requestDate: "",
    reason: "",
  });

  // Get current shift from assignment data (backend returns shift_name, start_time, end_time, color directly)
  const currentShift = myShiftAssignment ? {
    id: myShiftAssignment.shift_id,
    name: myShiftAssignment.shift_name || '',
    color: myShiftAssignment.shift_color || myShiftAssignment.color || '#3B82F6',
    start_time: myShiftAssignment.start_time || '',
    end_time: myShiftAssignment.end_time || '',
  } : null;

  // Helper to get employee name
  const getEmployeeName = (exchange: ShiftExchangeRequest, type: "requester" | "target") => {
    const emp = type === "requester" ? exchange.requester : exchange.target_employee;
    if (emp?.profile?.first_name || emp?.profile?.last_name) {
      return `${emp.profile.first_name || ""} ${emp.profile.last_name || ""}`.trim();
    }
    return emp?.employee_id || "Unknown";
  };

  // Get shift assignment for an employee
  const getEmployeeAssignment = (employeeId: string) => {
    return shiftAssignments.find((a) => a.employee_id === employeeId && a.is_active);
  };

  // Get shift by id
  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId);
  };

  // Get available employees with their shifts (excluding current employee)
  const employeesWithShifts = employees
    .filter((emp) => emp.id !== currentEmployee?.id)
    .map((emp) => {
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
    })
    .filter((e) => e.shiftId);

  const handleCreateRequest = () => {
    if (!currentEmployee?.id || !myShiftAssignment) return;

    const targetAssignment = getEmployeeAssignment(formData.targetEmployeeId);
    if (!targetAssignment) return;

    createExchange.mutate(
      {
        requester_id: currentEmployee.id,
        target_employee_id: formData.targetEmployeeId,
        requester_shift_id: myShiftAssignment.shift_id,
        target_shift_id: targetAssignment.shift_id,
        request_date: formData.requestDate,
        reason: formData.reason,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
        },
      }
    );
  };

  const handleCancelRequest = (exchangeId: string) => {
    cancelExchange.mutate(exchangeId);
  };

  const handleRespondToRequest = () => {
    if (!selectedExchange) return;

    // When employee declines, reject the request
    // When employee accepts, it still needs manager approval (status stays pending)
    const newStatus = responseAction === "decline" ? "rejected" : "pending";

    updateExchange.mutate(
      {
        id: selectedExchange.id,
        status: newStatus,
        response_note: responseAction === "decline" ? responseNote : undefined,
      },
      {
        onSuccess: () => {
          setIsRespondOpen(false);
          setResponseNote("");
          setSelectedExchange(null);
        },
      }
    );
  };

  const openRespondDialog = (exchange: ShiftExchangeRequest, action: "accept" | "decline") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsRespondOpen(true);
  };

  const pendingCount = myRequests.filter((e) => e.status === "pending").length;
  const approvedCount = myRequests.filter((e) => e.status === "approved").length;

  if (isLoadingEmployee || isLoadingExchanges) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shift Exchange</h1>
          <p className="text-muted-foreground">Request to swap shifts with colleagues</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!myShiftAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Current Shift Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Current Shift</p>
                <div className="flex items-center gap-2 mt-1">
                  {currentShift ? (
                    <>
                      <ShiftBadge name={currentShift.name} color={currentShift.color || "#3B82F6"} />
                      <span className="text-sm text-muted-foreground">
                        {currentShift.start_time} - {currentShift.end_time}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No shift assigned</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{incomingRequests.length}</p>
                <p className="text-xs text-muted-foreground">Incoming</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for My Requests and Incoming */}
      <Tabs defaultValue={incomingRequests.length > 0 ? "incoming" : "sent"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="h-4 w-4" />
            Incoming
            {incomingRequests.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {incomingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>

        {/* Incoming Requests Tab */}
        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Swap Requests</CardTitle>
              <CardDescription>Colleagues requesting to swap shifts with you</CardDescription>
            </CardHeader>
            <CardContent>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No incoming requests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When someone requests to swap shifts with you, it will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((exchange) => (
                    <div
                      key={exchange.id}
                      className="p-4 border rounded-lg bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{getEmployeeName(exchange, "requester")}</p>
                            <p className="text-sm text-muted-foreground">
                              wants to swap shifts with you
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {exchange.requester_shift && (
                                <ShiftBadge
                                  name={exchange.requester_shift.name}
                                  color={exchange.requester_shift.color || "#3B82F6"}
                                />
                              )}
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              {exchange.target_shift && (
                                <ShiftBadge
                                  name={exchange.target_shift.name}
                                  color={exchange.target_shift.color || "#3B82F6"}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(exchange.request_date), "MMM d, yyyy")}
                              </span>
                            </div>
                            {exchange.reason && (
                              <p className="mt-2 text-sm text-muted-foreground bg-background p-2 rounded">
                                "{exchange.reason}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openRespondDialog(exchange, "decline")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openRespondDialog(exchange, "accept")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>My Exchange Requests</CardTitle>
              <CardDescription>Requests you've sent to swap shifts</CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No exchange requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new request to swap shifts with a colleague
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((exchange) => {
                    const StatusIcon = statusConfig[exchange.status]?.icon || Clock;

                    return (
                      <div
                        key={exchange.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: exchange.requester_shift?.color || "#3B82F6" }}
                            />
                            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: exchange.target_shift?.color || "#3B82F6" }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">You</span>
                              {exchange.requester_shift && (
                                <ShiftBadge
                                  name={exchange.requester_shift.name}
                                  color={exchange.requester_shift.color || "#3B82F6"}
                                />
                              )}
                              <span className="text-muted-foreground">↔</span>
                              <span className="font-medium">{getEmployeeName(exchange, "target")}</span>
                              {exchange.target_shift && (
                                <ShiftBadge
                                  name={exchange.target_shift.name}
                                  color={exchange.target_shift.color || "#3B82F6"}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(exchange.request_date), "MMM d, yyyy")}
                              </span>
                              <span>•</span>
                              <span>Created {format(new Date(exchange.created_at), "MMM d")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              statusConfig[exchange.status]?.className || ""
                            }`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig[exchange.status]?.label || exchange.status}
                          </span>
                          <div className="flex gap-1">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelRequest(exchange.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Exchange</DialogTitle>
            <DialogDescription>
              Submit a request to swap your shift with a colleague
            </DialogDescription>
          </DialogHeader>

          {/* Your shift info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Current Shift</p>
            <div className="flex items-center gap-2">
              {currentShift ? (
                <>
                  <ShiftBadge name={currentShift.name} color={currentShift.color || "#3B82F6"} />
                  <span className="text-sm">
                    {currentShift.start_time} - {currentShift.end_time}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No shift assigned</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Swap With</label>
              <Select
                value={formData.targetEmployeeId}
                onValueChange={(value) => setFormData({ ...formData, targetEmployeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select colleague" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithShifts.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <span>{e.name}</span>
                        <span className="text-muted-foreground">({e.shiftName})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange Date</label>
              <DatePicker
                value={formData.requestDate}
                onChange={(value) => setFormData({ ...formData, requestDate: value })}
                placeholder="Select exchange date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Exchange</label>
              <Textarea
                placeholder="Explain why you need to swap shifts..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Your request will be reviewed by a manager. You'll be notified once it's approved or rejected.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={!formData.targetEmployeeId || !formData.requestDate || !formData.reason || createExchange.isPending}
            >
              {createExchange.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exchange Request Details</DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedExchange.requester_id === currentEmployee?.id ? "You" : getEmployeeName(selectedExchange, "requester")}
                  </p>
                  {selectedExchange.requester_shift && (
                    <ShiftBadge
                      name={selectedExchange.requester_shift.name}
                      color={selectedExchange.requester_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedExchange.target_employee_id === currentEmployee?.id ? "You" : getEmployeeName(selectedExchange, "target")}
                  </p>
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
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedExchange.response_note}
                  </p>
                </div>
              )}

              {selectedExchange.status === "pending" && selectedExchange.requester_id === currentEmployee?.id && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    handleCancelRequest(selectedExchange.id);
                    setIsViewOpen(false);
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond to Request Dialog */}
      <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseAction === "accept" ? "Accept Shift Swap" : "Decline Shift Swap"}
            </DialogTitle>
            <DialogDescription>
              {responseAction === "accept"
                ? "By accepting, you agree to swap shifts. The request will still need manager approval."
                : "Let the requester know why you're declining."}
            </DialogDescription>
          </DialogHeader>

          {selectedExchange && (
            <div className="py-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
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
                  <p className="text-sm font-medium">You</p>
                  {selectedExchange.target_shift && (
                    <ShiftBadge
                      name={selectedExchange.target_shift.name}
                      color={selectedExchange.target_shift.color || "#3B82F6"}
                    />
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Swap date: {format(new Date(selectedExchange.request_date), "MMMM d, yyyy")}
                </span>
              </div>

              {responseAction === "decline" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for declining (optional)</label>
                  <Textarea
                    placeholder="Let them know why you can't swap..."
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {responseAction === "accept" && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Once you accept, the request will be sent to your manager for final approval.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRespondOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={responseAction === "accept" ? "default" : "destructive"}
              onClick={handleRespondToRequest}
              disabled={updateExchange.isPending}
            >
              {updateExchange.isPending
                ? "Processing..."
                : responseAction === "accept"
                ? "Accept Swap"
                : "Decline Swap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
