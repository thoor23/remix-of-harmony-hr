import { useState } from "react";
import { format } from "date-fns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
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
import { defaultShiftExchanges, defaultShiftAssignments, defaultShifts } from "@/data/settingsData";
import type { ShiftExchangeRequest } from "@/types/settings";

// Mock current employee - in real app, get from auth context
const CURRENT_EMPLOYEE_ID = "emp-2"; // Changed to emp-2 to show incoming requests
const CURRENT_EMPLOYEE = defaultShiftAssignments.find(a => a.employeeId === CURRENT_EMPLOYEE_ID)!;

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function EmployeeShiftExchange() {
  const { toast } = useToast();
  
  const [allExchanges, setAllExchanges] = useState<ShiftExchangeRequest[]>(defaultShiftExchanges);
  
  // Filter exchanges
  const myRequests = allExchanges.filter(e => e.requesterId === CURRENT_EMPLOYEE_ID);
  const incomingRequests = allExchanges.filter(
    e => e.targetEmployeeId === CURRENT_EMPLOYEE_ID && e.status === "pending"
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

  const currentShift = defaultShifts.find(s => s.id === CURRENT_EMPLOYEE.shiftId);

  const getTargetAssignment = (employeeId: string) => {
    return defaultShiftAssignments.find((a) => a.employeeId === employeeId);
  };

  const getShift = (shiftId: string) => {
    return defaultShifts.find((s) => s.id === shiftId);
  };

  const handleCreateRequest = () => {
    const targetAssignment = getTargetAssignment(formData.targetEmployeeId);
    const targetShift = getShift(targetAssignment?.shiftId || "");

    if (!targetAssignment || !targetShift || !currentShift) {
      toast({ title: "Error", description: "Invalid selection", variant: "destructive" });
      return;
    }

    const newExchange: ShiftExchangeRequest = {
      id: `exchange-${Date.now()}`,
      requesterId: CURRENT_EMPLOYEE_ID,
      requesterName: CURRENT_EMPLOYEE.employeeName,
      requesterShiftId: currentShift.id,
      requesterShiftName: currentShift.name,
      requesterShiftColor: currentShift.color,
      requestDate: formData.requestDate,
      targetEmployeeId: formData.targetEmployeeId,
      targetEmployeeName: targetAssignment.employeeName,
      targetShiftId: targetShift.id,
      targetShiftName: targetShift.name,
      targetShiftColor: targetShift.color,
      reason: formData.reason,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setAllExchanges([newExchange, ...allExchanges]);
    setIsCreateOpen(false);
    setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
    toast({ 
      title: "Request Submitted", 
      description: "Your shift exchange request has been sent for approval" 
    });
  };

  const handleCancelRequest = (exchangeId: string) => {
    setAllExchanges(
      allExchanges.map((e) =>
        e.id === exchangeId
          ? { ...e, status: "cancelled" as const, updatedAt: new Date().toISOString().split("T")[0] }
          : e
      )
    );
    toast({ title: "Request Cancelled", description: "Your shift exchange request has been cancelled" });
  };

  const handleRespondToRequest = () => {
    if (!selectedExchange) return;
    
    // When employee accepts/declines, it still needs manager approval
    // Here we're simulating employee consent - in real app this would update a consent field
    const newStatus = responseAction === "accept" ? "pending" : "rejected";
    
    setAllExchanges(
      allExchanges.map((e) =>
        e.id === selectedExchange.id
          ? {
              ...e,
              status: newStatus as "pending" | "rejected",
              responseNote: responseAction === "decline" ? responseNote : e.responseNote,
              respondedBy: responseAction === "decline" ? CURRENT_EMPLOYEE.employeeName : e.respondedBy,
              respondedAt: responseAction === "decline" ? new Date().toISOString().split("T")[0] : e.respondedAt,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : e
      )
    );
    
    setIsRespondOpen(false);
    setResponseNote("");
    
    toast({
      title: responseAction === "accept" ? "Swap Accepted" : "Swap Declined",
      description: responseAction === "accept" 
        ? "You've agreed to the swap. Awaiting manager approval." 
        : "You've declined the swap request.",
    });
  };

  const openRespondDialog = (exchange: ShiftExchangeRequest, action: "accept" | "decline") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsRespondOpen(true);
  };

  const pendingCount = myRequests.filter(e => e.status === "pending").length;
  const approvedCount = myRequests.filter(e => e.status === "approved").length;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shift Exchange</h1>
          <p className="text-muted-foreground">Request to swap shifts with colleagues</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
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
                  {currentShift && (
                    <>
                      <ShiftBadge name={currentShift.name} color={currentShift.color} />
                      <span className="text-sm text-muted-foreground">
                        {currentShift.isFlexible ? "Flexible Hours" : `${currentShift.startTime} - ${currentShift.endTime}`}
                      </span>
                    </>
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
                            <p className="font-medium">{exchange.requesterName}</p>
                            <p className="text-sm text-muted-foreground">
                              wants to swap shifts with you
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <ShiftBadge name={exchange.requesterShiftName} color={exchange.requesterShiftColor} />
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <ShiftBadge name={exchange.targetShiftName} color={exchange.targetShiftColor} />
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(exchange.requestDate), "MMM d, yyyy")}
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
                    const StatusIcon = statusConfig[exchange.status].icon;
                    
                    return (
                      <div
                        key={exchange.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: exchange.requesterShiftColor }}
                            />
                            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: exchange.targetShiftColor }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">You</span>
                              <ShiftBadge name={exchange.requesterShiftName} color={exchange.requesterShiftColor} />
                              <span className="text-muted-foreground">↔</span>
                              <span className="font-medium">{exchange.targetEmployeeName}</span>
                              <ShiftBadge name={exchange.targetShiftName} color={exchange.targetShiftColor} />
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(exchange.requestDate), "MMM d, yyyy")}
                              </span>
                              <span>•</span>
                              <span>Created {format(new Date(exchange.createdAt), "MMM d")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              statusConfig[exchange.status].className
                            }`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig[exchange.status].label}
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
              {currentShift && (
                <>
                  <ShiftBadge name={currentShift.name} color={currentShift.color} />
                  <span className="text-sm">
                    {currentShift.isFlexible ? "Flexible" : `${currentShift.startTime} - ${currentShift.endTime}`}
                  </span>
                </>
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
                  {defaultShiftAssignments
                    .filter((a) => a.employeeId !== CURRENT_EMPLOYEE_ID)
                    .map((a) => (
                      <SelectItem key={a.employeeId} value={a.employeeId}>
                        <div className="flex items-center gap-2">
                          <span>{a.employeeName}</span>
                          <span className="text-muted-foreground">({a.shiftName})</span>
                        </div>
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
                min={new Date().toISOString().split("T")[0]}
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
              disabled={!formData.targetEmployeeId || !formData.requestDate || !formData.reason}
            >
              Submit Request
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
                    {selectedExchange.requesterId === CURRENT_EMPLOYEE_ID ? "You" : selectedExchange.requesterName}
                  </p>
                  <ShiftBadge
                    name={selectedExchange.requesterShiftName}
                    color={selectedExchange.requesterShiftColor}
                  />
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedExchange.targetEmployeeId === CURRENT_EMPLOYEE_ID ? "You" : selectedExchange.targetEmployeeName}
                  </p>
                  <ShiftBadge
                    name={selectedExchange.targetShiftName}
                    color={selectedExchange.targetShiftColor}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Exchange Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedExchange.requestDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusConfig[selectedExchange.status].className
                    }`}
                  >
                    {statusConfig[selectedExchange.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested On</p>
                  <p className="font-medium">
                    {format(new Date(selectedExchange.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                {selectedExchange.respondedAt && (
                  <div>
                    <p className="text-muted-foreground">Responded On</p>
                    <p className="font-medium">
                      {format(new Date(selectedExchange.respondedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Reason</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedExchange.reason}</p>
              </div>

              {selectedExchange.responseNote && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Manager's Response</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedExchange.responseNote}
                  </p>
                  {selectedExchange.respondedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      — {selectedExchange.respondedBy}
                    </p>
                  )}
                </div>
              )}

              {selectedExchange.status === "pending" && selectedExchange.requesterId === CURRENT_EMPLOYEE_ID && (
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
                  <p className="text-sm font-medium">{selectedExchange.requesterName}</p>
                  <ShiftBadge name={selectedExchange.requesterShiftName} color={selectedExchange.requesterShiftColor} />
                </div>
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">You</p>
                  <ShiftBadge name={selectedExchange.targetShiftName} color={selectedExchange.targetShiftColor} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Swap date: {format(new Date(selectedExchange.requestDate), "MMMM d, yyyy")}
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
            >
              {responseAction === "accept" ? "Accept Swap" : "Decline Swap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
