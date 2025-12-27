import { useState } from "react";
import { format } from "date-fns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";
import { defaultShiftExchanges, defaultShiftAssignments, defaultShifts } from "@/data/settingsData";
import type { ShiftExchangeRequest } from "@/types/settings";

// Mock current employee - in real app, get from auth context
const CURRENT_EMPLOYEE_ID = "emp-1";
const CURRENT_EMPLOYEE = defaultShiftAssignments.find(a => a.employeeId === CURRENT_EMPLOYEE_ID)!;

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function EmployeeShiftExchange() {
  const { toast } = useToast();
  
  // Filter exchanges for current employee
  const [exchanges, setExchanges] = useState<ShiftExchangeRequest[]>(
    defaultShiftExchanges.filter(
      (e) => e.requesterId === CURRENT_EMPLOYEE_ID || e.targetEmployeeId === CURRENT_EMPLOYEE_ID
    )
  );
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ShiftExchangeRequest | null>(null);

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

    setExchanges([newExchange, ...exchanges]);
    setIsCreateOpen(false);
    setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
    toast({ 
      title: "Request Submitted", 
      description: "Your shift exchange request has been sent for approval" 
    });
  };

  const handleCancelRequest = (exchangeId: string) => {
    setExchanges(
      exchanges.map((e) =>
        e.id === exchangeId
          ? { ...e, status: "cancelled" as const, updatedAt: new Date().toISOString().split("T")[0] }
          : e
      )
    );
    toast({ title: "Request Cancelled", description: "Your shift exchange request has been cancelled" });
  };

  const pendingCount = exchanges.filter(e => e.status === "pending").length;
  const approvedCount = exchanges.filter(e => e.status === "approved").length;

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

      {/* Exchange Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Exchange Requests</CardTitle>
          <CardDescription>View and manage your shift swap requests</CardDescription>
        </CardHeader>
        <CardContent>
          {exchanges.length === 0 ? (
            <div className="text-center py-12">
              <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No exchange requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new request to swap shifts with a colleague
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exchanges.map((exchange) => {
                const StatusIcon = statusConfig[exchange.status].icon;
                const isRequester = exchange.requesterId === CURRENT_EMPLOYEE_ID;
                
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
                          <span className="font-medium">
                            {isRequester ? "You" : exchange.requesterName}
                          </span>
                          <ShiftBadge name={exchange.requesterShiftName} color={exchange.requesterShiftColor} />
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium">
                            {!isRequester ? "You" : exchange.targetEmployeeName}
                          </span>
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
                        {exchange.status === "pending" && isRequester && (
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
    </PageContainer>
  );
}
