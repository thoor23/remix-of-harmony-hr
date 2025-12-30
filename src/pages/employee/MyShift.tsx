import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import {
  Clock,
  Calendar,
  Coffee,
  Timer,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyShiftAssignment, useShifts } from "@/hooks/useShifts";

export default function MyShift() {
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee();
  const { data: myShiftAssignments = [], isLoading: isLoadingShift } = useMyShiftAssignment(currentEmployee?.id);
  const { data: shifts = [] } = useShifts();

  const myShiftAssignment = Array.isArray(myShiftAssignments) ? myShiftAssignments[0] : myShiftAssignments;

  const currentShift = myShiftAssignment ? shifts.find(s => s.id === myShiftAssignment.shift_id) : null;

  const formatTime = (time: string | null | undefined) => {
    if (!time) return "-";
    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch {
      return time;
    }
  };

  const calculateWorkHours = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return "-";
    try {
      const [startHours, startMinutes] = start.split(":").map(Number);
      const [endHours, endMinutes] = end.split(":").map(Number);
      let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    } catch {
      return "-";
    }
  };

  const isNightShift = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return false;
    try {
      const startHour = parseInt(start.split(":")[0]);
      const endHour = parseInt(end.split(":")[0]);
      return startHour >= 18 || endHour <= 6 || endHour < startHour;
    } catch {
      return false;
    }
  };

  const isLoading = isLoadingEmployee || isLoadingShift;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Shift Schedule" description="View your current shift assignment and details" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  if (!myShiftAssignment) {
    return (
      <PageContainer>
        <PageHeader title="My Shift Schedule" description="View your current shift assignment and details" />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Shift Assigned</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You don't have any shift assigned yet. Please contact your manager or HR for shift assignment.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const shiftName = myShiftAssignment.shift_name || currentShift?.name || "Unknown Shift";
  const shiftColor = myShiftAssignment.shift_color || myShiftAssignment.color || currentShift?.color || "#3B82F6";
  const startTime = myShiftAssignment.start_time || currentShift?.start_time;
  const endTime = myShiftAssignment.end_time || currentShift?.end_time;
  const breakDuration = currentShift?.break_duration || 0;
  const isNight = isNightShift(startTime, endTime);

  return (
    <PageContainer>
      <PageHeader
        title="My Shift Schedule"
        description="View your current shift assignment and details"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Current Shift"
          value={shiftName}
          icon={Clock}
        />
        <StatCard
          title="Shift Timing"
          value={`${formatTime(startTime)} - ${formatTime(endTime)}`}
          icon={Timer}
        />
        <StatCard
          title="Work Hours"
          value={calculateWorkHours(startTime, endTime)}
          icon={isNight ? Moon : Sun}
        />
        <StatCard
          title="Break Duration"
          value={breakDuration > 0 ? `${breakDuration} min` : "No break"}
          icon={Coffee}
        />
      </div>

      {/* Shift Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                Shift Details
                <ShiftBadge 
                  name={shiftName} 
                  color={shiftColor} 
                />
              </CardTitle>
              <CardDescription className="mt-1">
                Your current shift assignment information
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isNight && (
                <Badge variant="secondary" className="gap-1">
                  <Moon className="h-3 w-3" />
                  Night Shift
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timing Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Timing Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Start Time</span>
                  </div>
                  <p className="text-xl font-semibold">{formatTime(startTime)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">End Time</span>
                  </div>
                  <p className="text-xl font-semibold">{formatTime(endTime)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Total Hours</span>
                  </div>
                  <p className="text-xl font-semibold">{calculateWorkHours(startTime, endTime)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Coffee className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Break</span>
                  </div>
                  <p className="text-xl font-semibold">{breakDuration > 0 ? `${breakDuration} min` : "None"}</p>
                </div>
              </div>
            </div>

            {/* Assignment Details Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Assignment Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Effective From</span>
                  </div>
                  <span className="font-medium">
                    {myShiftAssignment.start_date 
                      ? format(new Date(myShiftAssignment.start_date), "MMM dd, yyyy")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Effective To</span>
                  </div>
                  <span className="font-medium">
                    {myShiftAssignment.end_date 
                      ? format(new Date(myShiftAssignment.end_date), "MMM dd, yyyy")
                      : "Ongoing"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <Badge variant={myShiftAssignment.is_active ? "default" : "secondary"}>
                    {myShiftAssignment.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
