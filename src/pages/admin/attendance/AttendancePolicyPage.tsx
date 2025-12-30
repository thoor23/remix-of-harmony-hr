import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TimePicker } from "@/components/ui/time-picker";
import { useSystemSetting, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Clock, AlertTriangle, Timer, MapPin, CalendarClock, Loader2 } from "lucide-react";

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AttendancePolicy {
  workStartTime: string;
  workEndTime: string;
  halfDayCutoff: string;
  autoCheckoutTime: string;
  minHoursForFullDay: number;
  minHoursForHalfDay: number;
  weekends: string[];
  graceMinutes: number;
  earlyDepartureGrace: number;
  lunchBreakMinutes: number;
  flexibleTiming: boolean;
  compensateLate: boolean;
  allowOvertimeTracking: boolean;
  maxOvertimeHoursPerDay: number;
  maxOvertimeHoursPerWeek: number;
  overtimeMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  requireOvertimeApproval: boolean;
  requireGeoFencing: boolean;
  allowedRadius: number;
  requireIPRestriction: boolean;
  allowedIPs: string;
  requireSelfie: boolean;
  lateArrivalDeduction: number;
  earlyDepartureDeduction: number;
  absentDeduction: number;
  consecutiveLateThreshold: number;
  consecutiveLateAction: string;
}

const defaultPolicy: AttendancePolicy = {
  workStartTime: "09:00",
  workEndTime: "18:00",
  halfDayCutoff: "13:00",
  autoCheckoutTime: "23:59",
  minHoursForFullDay: 8,
  minHoursForHalfDay: 4,
  weekends: ["Saturday", "Sunday"],
  graceMinutes: 15,
  earlyDepartureGrace: 10,
  lunchBreakMinutes: 60,
  flexibleTiming: false,
  compensateLate: true,
  allowOvertimeTracking: true,
  maxOvertimeHoursPerDay: 4,
  maxOvertimeHoursPerWeek: 20,
  overtimeMultiplier: 1.5,
  weekendMultiplier: 2,
  holidayMultiplier: 2.5,
  requireOvertimeApproval: true,
  requireGeoFencing: false,
  allowedRadius: 100,
  requireIPRestriction: false,
  allowedIPs: "",
  requireSelfie: false,
  lateArrivalDeduction: 0.5,
  earlyDepartureDeduction: 0.5,
  absentDeduction: 1,
  consecutiveLateThreshold: 3,
  consecutiveLateAction: "warning",
};

export default function AttendancePolicyPage() {
  const { data: savedSetting, isLoading } = useSystemSetting("attendance_policy");
  const updateSetting = useUpdateSystemSetting();
  
  const [policy, setPolicy] = useState<AttendancePolicy>(defaultPolicy);

  // Load saved settings when data is available
  useEffect(() => {
    if (savedSetting?.value) {
      const saved = savedSetting.value as Record<string, unknown>;
      setPolicy(prev => ({
        ...prev,
        workStartTime: (saved.workStartTime as string) || prev.workStartTime,
        workEndTime: (saved.workEndTime as string) || prev.workEndTime,
        halfDayCutoff: (saved.halfDayCutoff as string) || prev.halfDayCutoff,
        autoCheckoutTime: (saved.autoCheckoutTime as string) || prev.autoCheckoutTime,
        minHoursForFullDay: (saved.workingHoursPerDay as number) || prev.minHoursForFullDay,
        minHoursForHalfDay: (saved.halfDayHours as number) || prev.minHoursForHalfDay,
        weekends: (saved.weekendDays as string[]) || prev.weekends,
        graceMinutes: (saved.lateThresholdMinutes as number) || prev.graceMinutes,
        allowOvertimeTracking: saved.allowOvertimeTracking !== undefined ? (saved.allowOvertimeTracking as boolean) : prev.allowOvertimeTracking,
        requireGeoFencing: (saved.requireLocationVerification as boolean) || prev.requireGeoFencing,
        ...saved,
      }));
    }
  }, [savedSetting]);

  const saveSettings = () => {
    updateSetting.mutate({
      key: "attendance_policy",
      value: {
        workStartTime: policy.workStartTime,
        workEndTime: policy.workEndTime,
        halfDayCutoff: policy.halfDayCutoff,
        autoCheckoutTime: policy.autoCheckoutTime,
        workingHoursPerDay: policy.minHoursForFullDay,
        halfDayHours: policy.minHoursForHalfDay,
        weekendDays: policy.weekends,
        lateThresholdMinutes: policy.graceMinutes,
        earlyDepartureGrace: policy.earlyDepartureGrace,
        lunchBreakMinutes: policy.lunchBreakMinutes,
        flexibleTiming: policy.flexibleTiming,
        compensateLate: policy.compensateLate,
        allowOvertimeTracking: policy.allowOvertimeTracking,
        maxOvertimeHoursPerDay: policy.maxOvertimeHoursPerDay,
        maxOvertimeHoursPerWeek: policy.maxOvertimeHoursPerWeek,
        overtimeMultiplier: policy.overtimeMultiplier,
        weekendMultiplier: policy.weekendMultiplier,
        holidayMultiplier: policy.holidayMultiplier,
        requireOvertimeApproval: policy.requireOvertimeApproval,
        requireLocationVerification: policy.requireGeoFencing,
        allowedRadius: policy.allowedRadius,
        requireIPRestriction: policy.requireIPRestriction,
        allowedIPs: policy.allowedIPs,
        requireSelfie: policy.requireSelfie,
        lateArrivalDeduction: policy.lateArrivalDeduction,
        earlyDepartureDeduction: policy.earlyDepartureDeduction,
        absentDeduction: policy.absentDeduction,
        consecutiveLateThreshold: policy.consecutiveLateThreshold,
        consecutiveLateAction: policy.consecutiveLateAction,
        allowRemoteCheckIn: true,
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Policy & Rules"
        description="Configure working hours, grace periods, overtime, and attendance marking rules"
      >
        <Button onClick={saveSettings} disabled={updateSetting.isPending}>
          {updateSetting.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save All Changes
        </Button>
      </PageHeader>

      <Tabs defaultValue="working-hours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="working-hours" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Working Hours</span>
          </TabsTrigger>
          <TabsTrigger value="grace-period" className="gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Grace Period</span>
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Overtime</span>
          </TabsTrigger>
          <TabsTrigger value="marking" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Marking Rules</span>
          </TabsTrigger>
          <TabsTrigger value="penalties" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Penalties</span>
          </TabsTrigger>
        </TabsList>

        {/* Working Hours Tab */}
        <TabsContent value="working-hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours Configuration
              </CardTitle>
              <CardDescription>Set up standard working hours and half-day rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Work Start Time</Label>
                  <TimePicker
                    value={policy.workStartTime}
                    onChange={(value) => setPolicy(prev => ({ ...prev, workStartTime: value }))}
                    placeholder="Select start time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work End Time</Label>
                  <TimePicker
                    value={policy.workEndTime}
                    onChange={(value) => setPolicy(prev => ({ ...prev, workEndTime: value }))}
                    placeholder="Select end time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Half-Day Cutoff</Label>
                  <TimePicker
                    value={policy.halfDayCutoff}
                    onChange={(value) => setPolicy(prev => ({ ...prev, halfDayCutoff: value }))}
                    placeholder="Select cutoff time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto Checkout Time</Label>
                  <TimePicker
                    value={policy.autoCheckoutTime}
                    onChange={(value) => setPolicy(prev => ({ ...prev, autoCheckoutTime: value }))}
                    placeholder="Select checkout time"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Hours for Full Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={policy.minHoursForFullDay}
                    onChange={(e) => setPolicy(prev => ({ ...prev, minHoursForFullDay: parseInt(e.target.value) || 8 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Hours for Half Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={policy.minHoursForHalfDay}
                    onChange={(e) => setPolicy(prev => ({ ...prev, minHoursForHalfDay: parseInt(e.target.value) || 4 }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Weekend Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      variant={policy.weekends.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPolicy(prev => ({
                          ...prev,
                          weekends: prev.weekends.includes(day)
                            ? prev.weekends.filter(d => d !== day)
                            : [...prev.weekends, day]
                        }));
                      }}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grace Period Tab */}
        <TabsContent value="grace-period">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Grace Period Rules
              </CardTitle>
              <CardDescription>Configure grace periods for late arrivals and early departures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Late Arrival Grace (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={policy.graceMinutes}
                    onChange={(e) => setPolicy(prev => ({ ...prev, graceMinutes: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Employees won't be marked late within this period</p>
                </div>
                <div className="space-y-2">
                  <Label>Early Departure Grace (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={policy.earlyDepartureGrace}
                    onChange={(e) => setPolicy(prev => ({ ...prev, earlyDepartureGrace: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Allow leaving early by this many minutes</p>
                </div>
                <div className="space-y-2">
                  <Label>Lunch Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={policy.lunchBreakMinutes}
                    onChange={(e) => setPolicy(prev => ({ ...prev, lunchBreakMinutes: parseInt(e.target.value) || 60 }))}
                  />
                  <p className="text-xs text-muted-foreground">Standard lunch break time</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Flexible Timing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to check in within a flexible time window
                  </p>
                </div>
                <Switch
                  checked={policy.flexibleTiming}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, flexibleTiming: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Compensate Late with Extended Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to compensate late arrival by working extra hours
                  </p>
                </div>
                <Switch
                  checked={policy.compensateLate}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, compensateLate: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Overtime Rules
              </CardTitle>
              <CardDescription>Configure overtime tracking and compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Overtime Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track hours worked beyond regular working hours
                  </p>
                </div>
                <Switch
                  checked={policy.allowOvertimeTracking}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, allowOvertimeTracking: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Max Overtime Hours/Day</Label>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={policy.maxOvertimeHoursPerDay}
                    onChange={(e) => setPolicy(prev => ({ ...prev, maxOvertimeHoursPerDay: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Overtime Hours/Week</Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={policy.maxOvertimeHoursPerWeek}
                    onChange={(e) => setPolicy(prev => ({ ...prev, maxOvertimeHoursPerWeek: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekday OT Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={3}
                    value={policy.overtimeMultiplier}
                    onChange={(e) => setPolicy(prev => ({ ...prev, overtimeMultiplier: parseFloat(e.target.value) || 1.5 }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Weekend OT Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={4}
                    value={policy.weekendMultiplier}
                    onChange={(e) => setPolicy(prev => ({ ...prev, weekendMultiplier: parseFloat(e.target.value) || 2 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Holiday OT Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={4}
                    value={policy.holidayMultiplier}
                    onChange={(e) => setPolicy(prev => ({ ...prev, holidayMultiplier: parseFloat(e.target.value) || 2.5 }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Manager Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Overtime must be approved by manager before being compensated
                  </p>
                </div>
                <Switch
                  checked={policy.requireOvertimeApproval}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireOvertimeApproval: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marking Rules Tab */}
        <TabsContent value="marking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Attendance Marking Rules
              </CardTitle>
              <CardDescription>Configure how employees can mark their attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Geo-Fencing</Label>
                  <p className="text-sm text-muted-foreground">
                    Employees must be within allowed radius to mark attendance
                  </p>
                </div>
                <Switch
                  checked={policy.requireGeoFencing}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireGeoFencing: checked }))}
                />
              </div>

              {policy.requireGeoFencing && (
                <div className="space-y-2">
                  <Label>Allowed Radius (meters)</Label>
                  <Input
                    type="number"
                    min={50}
                    max={5000}
                    value={policy.allowedRadius}
                    onChange={(e) => setPolicy(prev => ({ ...prev, allowedRadius: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require IP Restriction</Label>
                  <p className="text-sm text-muted-foreground">
                    Only allow attendance from specific IP addresses
                  </p>
                </div>
                <Switch
                  checked={policy.requireIPRestriction}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireIPRestriction: checked }))}
                />
              </div>

              {policy.requireIPRestriction && (
                <div className="space-y-2">
                  <Label>Allowed IP Addresses (comma-separated)</Label>
                  <Input
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={policy.allowedIPs}
                    onChange={(e) => setPolicy(prev => ({ ...prev, allowedIPs: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Selfie Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Employees must take a selfie when marking attendance
                  </p>
                </div>
                <Switch
                  checked={policy.requireSelfie}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireSelfie: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Penalties Tab */}
        <TabsContent value="penalties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Penalty Rules
              </CardTitle>
              <CardDescription>Configure deductions and penalties for attendance issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Late Arrival Deduction (days)</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={0}
                    max={1}
                    value={policy.lateArrivalDeduction}
                    onChange={(e) => setPolicy(prev => ({ ...prev, lateArrivalDeduction: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Deduction per late arrival</p>
                </div>
                <div className="space-y-2">
                  <Label>Early Departure Deduction (days)</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={0}
                    max={1}
                    value={policy.earlyDepartureDeduction}
                    onChange={(e) => setPolicy(prev => ({ ...prev, earlyDepartureDeduction: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Deduction per early departure</p>
                </div>
                <div className="space-y-2">
                  <Label>Absent Deduction (days)</Label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0}
                    max={2}
                    value={policy.absentDeduction}
                    onChange={(e) => setPolicy(prev => ({ ...prev, absentDeduction: parseFloat(e.target.value) || 1 }))}
                  />
                  <p className="text-xs text-muted-foreground">Deduction per absent day</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Consecutive Late Threshold</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={policy.consecutiveLateThreshold}
                    onChange={(e) => setPolicy(prev => ({ ...prev, consecutiveLateThreshold: parseInt(e.target.value) || 3 }))}
                  />
                  <p className="text-xs text-muted-foreground">Trigger action after this many consecutive late arrivals</p>
                </div>
                <div className="space-y-2">
                  <Label>Action on Consecutive Late</Label>
                  <Input
                    value={policy.consecutiveLateAction}
                    onChange={(e) => setPolicy(prev => ({ ...prev, consecutiveLateAction: e.target.value }))}
                    placeholder="warning, deduction, suspension"
                  />
                  <p className="text-xs text-muted-foreground">Action to take when threshold is reached</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
