import { useState } from "react";
import { format } from "date-fns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { useToast } from "@/hooks/use-toast";
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
import { defaultShiftExchanges, defaultShiftAssignments, defaultShifts } from "@/data/settingsData";
import type { ShiftExchangeRequest } from "@/types/settings";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", icon: Ban, className: "bg-muted text-muted-foreground border-border" },
};

export default function ShiftExchange() {
  const { toast } = useToast();
  const [exchanges, setExchanges] = useState<ShiftExchangeRequest[]>(defaultShiftExchanges);
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

  const filteredExchanges = exchanges.filter((exchange) => {
    const matchesSearch =
      exchange.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.targetEmployeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exchange.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: exchanges.length,
    pending: exchanges.filter((e) => e.status === "pending").length,
    approved: exchanges.filter((e) => e.status === "approved").length,
    rejected: exchanges.filter((e) => e.status === "rejected").length,
  };

  const getAssignment = (employeeId: string) => {
    return defaultShiftAssignments.find((a) => a.employeeId === employeeId);
  };

  const getShift = (shiftId: string) => {
    return defaultShifts.find((s) => s.id === shiftId);
  };

  const handleCreateExchange = () => {
    const requesterAssignment = getAssignment(formData.requesterId);
    const targetAssignment = getAssignment(formData.targetEmployeeId);
    const requesterShift = getShift(requesterAssignment?.shiftId || "");
    const targetShift = getShift(targetAssignment?.shiftId || "");

    if (!requesterAssignment || !targetAssignment || !requesterShift || !targetShift) {
      toast({ title: "Error", description: "Invalid employee selection", variant: "destructive" });
      return;
    }

    const newExchange: ShiftExchangeRequest = {
      id: `exchange-${Date.now()}`,
      requesterId: formData.requesterId,
      requesterName: requesterAssignment.employeeName,
      requesterShiftId: requesterShift.id,
      requesterShiftName: requesterShift.name,
      requesterShiftColor: requesterShift.color,
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
    setFormData({ requesterId: "", targetEmployeeId: "", requestDate: "", reason: "" });
    toast({ title: "Request Created", description: "Shift exchange request submitted successfully" });
  };

  const handleResponse = () => {
    if (!selectedExchange) return;

    setExchanges(
      exchanges.map((e) =>
        e.id === selectedExchange.id
          ? {
              ...e,
              status: responseAction === "approve" ? "approved" : "rejected",
              respondedBy: "Admin",
              respondedAt: new Date().toISOString().split("T")[0],
              responseNote: responseNote,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : e
      )
    );
    setIsResponseOpen(false);
    setResponseNote("");
    toast({
      title: responseAction === "approve" ? "Request Approved" : "Request Rejected",
      description: `Shift exchange request has been ${responseAction === "approve" ? "approved" : "rejected"}`,
    });
  };

  const openResponseDialog = (exchange: ShiftExchangeRequest, action: "approve" | "reject") => {
    setSelectedExchange(exchange);
    setResponseAction(action);
    setIsResponseOpen(true);
  };

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Shift Management", href: "/admin/shifts" },
          { label: "Exchange Requests" },
        ]}
      />

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
                  const StatusIcon = statusConfig[exchange.status].icon;
                  return (
                    <TableRow key={exchange.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{exchange.requesterName}</span>
                          <ShiftBadge
                            name={exchange.requesterShiftName}
                            color={exchange.requesterShiftColor}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{exchange.targetEmployeeName}</span>
                          <ShiftBadge
                            name={exchange.targetShiftName}
                            color={exchange.targetShiftColor}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(exchange.requestDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusConfig[exchange.status].className
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig[exchange.status].label}
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
                  {defaultShiftAssignments.map((a) => (
                    <SelectItem key={a.employeeId} value={a.employeeId}>
                      {a.employeeName} ({a.shiftName})
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
                  {defaultShiftAssignments
                    .filter((a) => a.employeeId !== formData.requesterId)
                    .map((a) => (
                      <SelectItem key={a.employeeId} value={a.employeeId}>
                        {a.employeeName} ({a.shiftName})
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
              disabled={!formData.requesterId || !formData.targetEmployeeId || !formData.requestDate}
            >
              Submit Request
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
                  <p className="font-medium">{selectedExchange.requesterName}</p>
                  <ShiftBadge
                    name={selectedExchange.requesterShiftName}
                    color={selectedExchange.requesterShiftColor}
                  />
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">{selectedExchange.targetEmployeeName}</p>
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
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedExchange.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                {selectedExchange.respondedAt && (
                  <div>
                    <p className="text-muted-foreground">Responded</p>
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
                  <p className="text-muted-foreground text-sm mb-1">Response Note</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedExchange.responseNote}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    — {selectedExchange.respondedBy}
                  </p>
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
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Response Note {responseAction === "reject" && "(recommended)"}
              </label>
              <Textarea
                placeholder={
                  responseAction === "approve"
                    ? "Optional approval note..."
                    : "Reason for rejection..."
                }
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={responseAction === "approve" ? "default" : "destructive"}
              onClick={handleResponse}
            >
              {responseAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
