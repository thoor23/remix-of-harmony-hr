import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultAttendanceSettings, weekDays } from "@/data/settingsData";
import { AttendanceSettings } from "@/types/settings";
import { toast } from "sonner";
import { Clock, AlertTriangle, Timer, MapPin, Shield, CalendarClock } from "lucide-react";

interface PenaltyRule {
  lateArrivalDeduction: number;
  earlyDepartureDeduction: number;
  absentDeduction: number;
  consecutiveLateThreshold: number;
  consecutiveLateAction: string;
}

interface AttendanceMarkingRule {
  requireGeoFencing: boolean;
  requireIPRestriction: boolean;
  requireSelfie: boolean;
  allowedRadius: number;
  allowedIPs: string;
}

interface OvertimeRule {
  maxOvertimeHoursPerDay: number;
  maxOvertimeHoursPerWeek: number;
  requireApproval: boolean;
  overtimeMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
}

export default function AttendancePolicyPage() {
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>(defaultAttendanceSettings);
  
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule>({
    lateArrivalDeduction: 0.5,
    earlyDepartureDeduction: 0.5,
    absentDeduction: 1,
    consecutiveLateThreshold: 3,
    consecutiveLateAction: "warning",
  });

  const [markingRules, setMarkingRules] = useState<AttendanceMarkingRule>({
    requireGeoFencing: false,
    requireIPRestriction: false,
    requireSelfie: false,
    allowedRadius: 100,
    allowedIPs: "",
  });

  const [overtimeRules, setOvertimeRules] = useState<OvertimeRule>({
    maxOvertimeHoursPerDay: 4,
    maxOvertimeHoursPerWeek: 20,
    requireApproval: true,
    overtimeMultiplier: 1.5,
    weekendMultiplier: 2,
    holidayMultiplier: 2.5,
  });

  const saveSettings = () => {
    toast.success("Attendance policy saved successfully");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Policy & Rules"
        description="Configure working hours, grace periods, overtime, and attendance marking rules"
      >
        <Button onClick={saveSettings}>Save All Changes</Button>
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
                  <Input
                    type="time"
                    value={attendanceSettings.workStartTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, workStartTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work End Time</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.workEndTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, workEndTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Half-Day Cutoff</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.halfDayCutoff}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, halfDayCutoff: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto Checkout Time</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.autoCheckoutTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, autoCheckoutTime: e.target.value }))}
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
                    value={attendanceSettings.minHoursForFullDay}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, minHoursForFullDay: parseInt(e.target.value) || 8 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Hours for Half Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    defaultValue={4}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Weekend Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      variant={attendanceSettings.weekends.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAttendanceSettings(prev => ({
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
                    value={attendanceSettings.graceMinutes}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, graceMinutes: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Employees won't be marked late within this period</p>
                </div>
                <div className="space-y-2">
                  <Label>Early Departure Grace (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    defaultValue={10}
                  />
                  <p className="text-xs text-muted-foreground">Allow leaving early by this many minutes</p>
                </div>
                <div className="space-y-2">
                  <Label>Lunch Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    defaultValue={60}
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
                <Switch />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Compensate Late with Extended Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to compensate late arrival by working extra hours
                  </p>
                </div>
                <Switch defaultChecked />
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
                  checked={attendanceSettings.allowOvertimeTracking}
                  onCheckedChange={(checked) => setAttendanceSettings(prev => ({ ...prev, allowOvertimeTracking: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Max Overtime Hours/Day</Label>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={overtimeRules.maxOvertimeHoursPerDay}
                    onChange={(e) => setOvertimeRules(prev => ({ ...prev, maxOvertimeHoursPerDay: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Overtime Hours/Week</Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={overtimeRules.maxOvertimeHoursPerWeek}
                    onChange={(e) => setOvertimeRules(prev => ({ ...prev, maxOvertimeHoursPerWeek: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekday OT Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={3}
                    value={overtimeRules.overtimeMultiplier}
                    onChange={(e) => setOvertimeRules(prev => ({ ...prev, overtimeMultiplier: parseFloat(e.target.value) || 1.5 }))}
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
                    value={overtimeRules.weekendMultiplier}
                    onChange={(e) => setOvertimeRules(prev => ({ ...prev, weekendMultiplier: parseFloat(e.target.value) || 2 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Holiday OT Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={4}
                    value={overtimeRules.holidayMultiplier}
                    onChange={(e) => setOvertimeRules(prev => ({ ...prev, holidayMultiplier: parseFloat(e.target.value) || 2.5 }))}
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
                  checked={overtimeRules.requireApproval}
                  onCheckedChange={(checked) => setOvertimeRules(prev => ({ ...prev, requireApproval: checked }))}
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
                  checked={markingRules.requireGeoFencing}
                  onCheckedChange={(checked) => setMarkingRules(prev => ({ ...prev, requireGeoFencing: checked }))}
                />
              </div>

              {markingRules.requireGeoFencing && (
                <div className="space-y-2">
                  <Label>Allowed Radius (meters)</Label>
                  <Input
                    type="number"
                    min={50}
                    max={5000}
                    value={markingRules.allowedRadius}
                    onChange={(e) => setMarkingRules(prev => ({ ...prev, allowedRadius: parseInt(e.target.value) || 100 }))}
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
                  checked={markingRules.requireIPRestriction}
                  onCheckedChange={(checked) => setMarkingRules(prev => ({ ...prev, requireIPRestriction: checked }))}
                />
              </div>

              {markingRules.requireIPRestriction && (
                <div className="space-y-2">
                  <Label>Allowed IP Addresses (comma-separated)</Label>
                  <Input
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={markingRules.allowedIPs}
                    onChange={(e) => setMarkingRules(prev => ({ ...prev, allowedIPs: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Selfie Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Employees must take a selfie while marking attendance
                  </p>
                </div>
                <Switch
                  checked={markingRules.requireSelfie}
                  onCheckedChange={(checked) => setMarkingRules(prev => ({ ...prev, requireSelfie: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Multiple Check-ins</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to check in and out multiple times per day
                  </p>
                </div>
                <Switch defaultChecked />
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
              <CardDescription>Configure deductions and actions for attendance violations</CardDescription>
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
                    value={penaltyRules.lateArrivalDeduction}
                    onChange={(e) => setPenaltyRules(prev => ({ ...prev, lateArrivalDeduction: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Leave deducted per late arrival</p>
                </div>
                <div className="space-y-2">
                  <Label>Early Departure Deduction (days)</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={0}
                    max={1}
                    value={penaltyRules.earlyDepartureDeduction}
                    onChange={(e) => setPenaltyRules(prev => ({ ...prev, earlyDepartureDeduction: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Leave deducted per early departure</p>
                </div>
                <div className="space-y-2">
                  <Label>Absent Deduction (days)</Label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0}
                    max={2}
                    value={penaltyRules.absentDeduction}
                    onChange={(e) => setPenaltyRules(prev => ({ ...prev, absentDeduction: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Leave deducted per unexcused absence</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Consecutive Late Threshold</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={penaltyRules.consecutiveLateThreshold}
                    onChange={(e) => setPenaltyRules(prev => ({ ...prev, consecutiveLateThreshold: parseInt(e.target.value) || 3 }))}
                  />
                  <p className="text-xs text-muted-foreground">Number of consecutive late arrivals before action</p>
                </div>
                <div className="space-y-2">
                  <Label>Action for Consecutive Late</Label>
                  <Select 
                    value={penaltyRules.consecutiveLateAction} 
                    onValueChange={(value) => setPenaltyRules(prev => ({ ...prev, consecutiveLateAction: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">Issue Warning</SelectItem>
                      <SelectItem value="half-day-deduction">Deduct Half Day</SelectItem>
                      <SelectItem value="full-day-deduction">Deduct Full Day</SelectItem>
                      <SelectItem value="notify-manager">Notify Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Auto-Apply Penalties</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically deduct leaves for violations
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Send Penalty Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify employees when penalties are applied
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
