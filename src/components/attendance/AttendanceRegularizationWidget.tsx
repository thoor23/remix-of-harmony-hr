import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, Clock, AlertCircle } from "lucide-react";
import {
  useMyRegularizationRequests,
  useCreateRegularizationRequest,
} from "@/hooks/useAttendanceRegularization";
import { format } from "date-fns";

interface AttendanceRegularizationWidgetProps {
  attendanceRecords?: Array<{
    id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
  }>;
}

export function AttendanceRegularizationWidget({
  attendanceRecords = [],
}: AttendanceRegularizationWidgetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState("correction");
  const [requestDate, setRequestDate] = useState("");
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | undefined>();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");

  const { data: myRequests = [], isLoading } = useMyRegularizationRequests();
  const createMutation = useCreateRegularizationRequest();

  const pendingRequests = myRequests.filter((r) => r.status === "pending");

  const handleSubmit = () => {
    if (!requestDate || !reason) return;

    createMutation.mutate(
      {
        request_date: requestDate,
        request_type: requestType,
        attendance_id: selectedAttendanceId,
        requested_check_in: checkIn || undefined,
        requested_check_out: checkOut || undefined,
        reason,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setRequestType("correction");
          setRequestDate("");
          setSelectedAttendanceId(undefined);
          setCheckIn("");
          setCheckOut("");
          setReason("");
        },
      }
    );
  };

  const handleDateChange = (date: string) => {
    setRequestDate(date);
    // Find matching attendance record
    const matchingRecord = attendanceRecords.find((r) => r.date === date);
    if (matchingRecord) {
      setSelectedAttendanceId(matchingRecord.id);
      setCheckIn(matchingRecord.check_in || "");
      setCheckOut(matchingRecord.check_out || "");
    } else {
      setSelectedAttendanceId(undefined);
      setCheckIn("");
      setCheckOut("");
    }
  };

  const requestTypeLabels: Record<string, string> = {
    correction: "Time Correction",
    missing_entry: "Missing Entry",
    overtime: "Overtime Claim",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regularization Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Attendance Regularization
            </CardTitle>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have {pendingRequests.length} pending request(s)
              </p>
              {pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(request.request_date), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {requestTypeLabels[request.request_type] || request.request_type}
                    </p>
                  </div>
                  <StatusBadge status={request.status as any} />
                </div>
              ))}
              {myRequests.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{myRequests.length - 3} more requests
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending regularization requests
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Attendance Regularization</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Request Type *</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correction">Time Correction</SelectItem>
                  <SelectItem value="missing_entry">Missing Entry</SelectItem>
                  <SelectItem value="overtime">Overtime Claim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <DatePicker
                value={requestDate}
                onChange={handleDateChange}
                placeholder="Select date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correct Check-in Time</Label>
                <TimePicker
                  value={checkIn}
                  onChange={setCheckIn}
                  placeholder="Select time"
                />
              </div>
              <div className="space-y-2">
                <Label>Correct Check-out Time</Label>
                <TimePicker
                  value={checkOut}
                  onChange={setCheckOut}
                  placeholder="Select time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Please explain the reason for this regularization request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!requestDate || !reason || createMutation.isPending}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
