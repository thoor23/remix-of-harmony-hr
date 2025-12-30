import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TimePicker } from "@/components/ui/time-picker";
import { useSystemSetting, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Clock, RefreshCw, ArrowLeftRight, Moon, Coffee, DollarSign, Loader2 } from "lucide-react";

interface ShiftPolicy {
  // Shift Change Rules
  minNoticePeriodDays: number;
  requireApproval: boolean;
  maxChangesPerMonth: number;
  allowSameDayChange: boolean;
  // Overtime Policy
  minHoursBeforeOT: number;
  otStartsAfter: string;
  weekdayMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  // Break Policy
  mandatoryBreakAfterHours: number;
  minBreakDuration: number;
  maxBreakDuration: number;
  paidBreak: boolean;
  // Rotation Rules
  enableAutoRotation: boolean;
  rotationFrequency: string;
  noticeBeforeRotation: number;
  fairnessCheck: boolean;
  // Exchange Rules
  allowExchange: boolean;
  requireBothApproval: boolean;
  requireManagerApproval: boolean;
  minExchangeNotice: number;
  sameDepartmentOnly: boolean;
  // Night Shift Policy
  nightShiftStartTime: string;
  nightShiftEndTime: string;
  nightShiftAllowance: number;
  allowanceType: string;
  maxConsecutiveNights: number;
}

const defaultPolicy: ShiftPolicy = {
  minNoticePeriodDays: 7,
  requireApproval: true,
  maxChangesPerMonth: 2,
  allowSameDayChange: false,
  minHoursBeforeOT: 8,
  otStartsAfter: "18:00",
  weekdayMultiplier: 1.5,
  weekendMultiplier: 2,
  holidayMultiplier: 2.5,
  mandatoryBreakAfterHours: 4,
  minBreakDuration: 30,
  maxBreakDuration: 60,
  paidBreak: true,
  enableAutoRotation: true,
  rotationFrequency: "weekly",
  noticeBeforeRotation: 3,
  fairnessCheck: true,
  allowExchange: true,
  requireBothApproval: true,
  requireManagerApproval: true,
  minExchangeNotice: 24,
  sameDepartmentOnly: false,
  nightShiftStartTime: "22:00",
  nightShiftEndTime: "06:00",
  nightShiftAllowance: 500,
  allowanceType: "fixed",
  maxConsecutiveNights: 5,
};

export default function ShiftPolicyPage() {
  const { data: savedSetting, isLoading } = useSystemSetting("shift_policy");
  const updateSetting = useUpdateSystemSetting();
  
  const [policy, setPolicy] = useState<ShiftPolicy>(defaultPolicy);

  // Load saved settings when data is available
  useEffect(() => {
    if (savedSetting?.value) {
      const saved = savedSetting.value as Record<string, unknown>;
      setPolicy(prev => ({
        ...prev,
        allowExchange: saved.allowShiftExchange !== undefined ? (saved.allowShiftExchange as boolean) : prev.allowExchange,
        requireManagerApproval: saved.requireManagerApproval !== undefined ? (saved.requireManagerApproval as boolean) : prev.requireManagerApproval,
        minExchangeNotice: (saved.exchangeRequestDeadlineHours as number) || prev.minExchangeNotice,
        weekdayMultiplier: (saved.overtimeMultiplier as number) || prev.weekdayMultiplier,
        weekendMultiplier: (saved.weekendMultiplier as number) || prev.weekendMultiplier,
        maxConsecutiveNights: (saved.maxConsecutiveWorkDays as number) || prev.maxConsecutiveNights,
        ...saved,
      }));
    }
  }, [savedSetting]);

  const saveSettings = () => {
    updateSetting.mutate({
      key: "shift_policy",
      value: {
        minRestBetweenShifts: 8,
        maxConsecutiveWorkDays: policy.maxConsecutiveNights,
        allowShiftExchange: policy.allowExchange,
        requireManagerApproval: policy.requireManagerApproval,
        exchangeRequestDeadlineHours: policy.minExchangeNotice,
        overtimeMultiplier: policy.weekdayMultiplier,
        weekendMultiplier: policy.weekendMultiplier,
        // Extended settings
        minNoticePeriodDays: policy.minNoticePeriodDays,
        requireApproval: policy.requireApproval,
        maxChangesPerMonth: policy.maxChangesPerMonth,
        allowSameDayChange: policy.allowSameDayChange,
        minHoursBeforeOT: policy.minHoursBeforeOT,
        otStartsAfter: policy.otStartsAfter,
        holidayMultiplier: policy.holidayMultiplier,
        mandatoryBreakAfterHours: policy.mandatoryBreakAfterHours,
        minBreakDuration: policy.minBreakDuration,
        maxBreakDuration: policy.maxBreakDuration,
        paidBreak: policy.paidBreak,
        enableAutoRotation: policy.enableAutoRotation,
        rotationFrequency: policy.rotationFrequency,
        noticeBeforeRotation: policy.noticeBeforeRotation,
        fairnessCheck: policy.fairnessCheck,
        requireBothApproval: policy.requireBothApproval,
        sameDepartmentOnly: policy.sameDepartmentOnly,
        nightShiftStartTime: policy.nightShiftStartTime,
        nightShiftEndTime: policy.nightShiftEndTime,
        nightShiftAllowance: policy.nightShiftAllowance,
        allowanceType: policy.allowanceType,
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
        title="Shift Policy & Rules"
        description="Configure shift changes, overtime, breaks, rotations, and exchange policies"
      >
        <Button onClick={saveSettings} disabled={updateSetting.isPending}>
          {updateSetting.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save All Changes
        </Button>
      </PageHeader>

      <Tabs defaultValue="shift-change" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="shift-change" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Shift Change</span>
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Overtime</span>
          </TabsTrigger>
          <TabsTrigger value="breaks" className="gap-2">
            <Coffee className="h-4 w-4" />
            <span className="hidden sm:inline">Breaks</span>
          </TabsTrigger>
          <TabsTrigger value="rotation" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Rotation</span>
          </TabsTrigger>
          <TabsTrigger value="exchange" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Exchange</span>
          </TabsTrigger>
          <TabsTrigger value="night-shift" className="gap-2">
            <Moon className="h-4 w-4" />
            <span className="hidden sm:inline">Night Shift</span>
          </TabsTrigger>
        </TabsList>

        {/* Shift Change Tab */}
        <TabsContent value="shift-change">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shift Change Rules
              </CardTitle>
              <CardDescription>Configure rules for changing employee shifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Notice Period (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={policy.minNoticePeriodDays}
                    onChange={(e) => setPolicy(prev => ({ ...prev, minNoticePeriodDays: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Days notice required before shift change</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Changes Per Month</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={policy.maxChangesPerMonth}
                    onChange={(e) => setPolicy(prev => ({ ...prev, maxChangesPerMonth: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum shift changes allowed per month</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Manager Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    All shift changes require manager approval
                  </p>
                </div>
                <Switch
                  checked={policy.requireApproval}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireApproval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Same-Day Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow emergency shift changes on the same day
                  </p>
                </div>
                <Switch
                  checked={policy.allowSameDayChange}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, allowSameDayChange: checked }))}
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
                <DollarSign className="h-5 w-5" />
                Overtime Policies
              </CardTitle>
              <CardDescription>Configure overtime compensation rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Hours Before OT</Label>
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={policy.minHoursBeforeOT}
                    onChange={(e) => setPolicy(prev => ({ ...prev, minHoursBeforeOT: parseInt(e.target.value) || 8 }))}
                  />
                  <p className="text-xs text-muted-foreground">Work hours before overtime kicks in</p>
                </div>
                <div className="space-y-2">
                  <Label>OT Starts After</Label>
                  <TimePicker
                    value={policy.otStartsAfter}
                    onChange={(value) => setPolicy(prev => ({ ...prev, otStartsAfter: value }))}
                    placeholder="Select time"
                  />
                  <p className="text-xs text-muted-foreground">Time after which overtime begins</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Weekday Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={3}
                    value={policy.weekdayMultiplier}
                    onChange={(e) => setPolicy(prev => ({ ...prev, weekdayMultiplier: parseFloat(e.target.value) || 1.5 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekend Multiplier</Label>
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
                  <Label>Holiday Multiplier</Label>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Break Time Policies
              </CardTitle>
              <CardDescription>Configure mandatory break rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Mandatory Break After (hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={policy.mandatoryBreakAfterHours}
                    onChange={(e) => setPolicy(prev => ({ ...prev, mandatoryBreakAfterHours: parseInt(e.target.value) || 4 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Break Duration (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={60}
                    value={policy.minBreakDuration}
                    onChange={(e) => setPolicy(prev => ({ ...prev, minBreakDuration: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Break Duration (min)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={120}
                    value={policy.maxBreakDuration}
                    onChange={(e) => setPolicy(prev => ({ ...prev, maxBreakDuration: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Paid Breaks</Label>
                  <p className="text-sm text-muted-foreground">
                    Break time is included in paid hours
                  </p>
                </div>
                <Switch
                  checked={policy.paidBreak}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, paidBreak: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rotation Tab */}
        <TabsContent value="rotation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Rotation Rules
              </CardTitle>
              <CardDescription>Configure automatic shift rotation policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enable Auto Rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate shifts based on schedule
                  </p>
                </div>
                <Switch
                  checked={policy.enableAutoRotation}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, enableAutoRotation: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rotation Frequency</Label>
                  <Select
                    value={policy.rotationFrequency}
                    onValueChange={(value) => setPolicy(prev => ({ ...prev, rotationFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notice Before Rotation (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    value={policy.noticeBeforeRotation}
                    onChange={(e) => setPolicy(prev => ({ ...prev, noticeBeforeRotation: parseInt(e.target.value) || 3 }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Fairness Check</Label>
                  <p className="text-sm text-muted-foreground">
                    Ensure equal distribution of desirable/undesirable shifts
                  </p>
                </div>
                <Switch
                  checked={policy.fairnessCheck}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, fairnessCheck: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Tab */}
        <TabsContent value="exchange">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Exchange Rules
              </CardTitle>
              <CardDescription>Configure shift exchange policies between employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Shift Exchange</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to exchange shifts with each other
                  </p>
                </div>
                <Switch
                  checked={policy.allowExchange}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, allowExchange: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Exchange Notice (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={policy.minExchangeNotice}
                  onChange={(e) => setPolicy(prev => ({ ...prev, minExchangeNotice: parseInt(e.target.value) || 24 }))}
                />
                <p className="text-xs text-muted-foreground">How far in advance must the exchange be requested</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Both Employees' Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Both employees must agree to the exchange
                  </p>
                </div>
                <Switch
                  checked={policy.requireBothApproval}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireBothApproval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Manager Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Manager must approve all shift exchanges
                  </p>
                </div>
                <Switch
                  checked={policy.requireManagerApproval}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, requireManagerApproval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Same Department Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only allow exchanges within the same department
                  </p>
                </div>
                <Switch
                  checked={policy.sameDepartmentOnly}
                  onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, sameDepartmentOnly: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Night Shift Tab */}
        <TabsContent value="night-shift">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Night Shift Policies
              </CardTitle>
              <CardDescription>Configure night shift allowances and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Night Shift Start Time</Label>
                  <TimePicker
                    value={policy.nightShiftStartTime}
                    onChange={(value) => setPolicy(prev => ({ ...prev, nightShiftStartTime: value }))}
                    placeholder="Select start time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Night Shift End Time</Label>
                  <TimePicker
                    value={policy.nightShiftEndTime}
                    onChange={(value) => setPolicy(prev => ({ ...prev, nightShiftEndTime: value }))}
                    placeholder="Select end time"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Night Shift Allowance</Label>
                  <Input
                    type="number"
                    min={0}
                    value={policy.nightShiftAllowance}
                    onChange={(e) => setPolicy(prev => ({ ...prev, nightShiftAllowance: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowance Type</Label>
                  <Select
                    value={policy.allowanceType}
                    onValueChange={(value) => setPolicy(prev => ({ ...prev, allowanceType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage of Salary</SelectItem>
                      <SelectItem value="per-hour">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Consecutive Night Shifts</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={policy.maxConsecutiveNights}
                  onChange={(e) => setPolicy(prev => ({ ...prev, maxConsecutiveNights: parseInt(e.target.value) || 5 }))}
                />
                <p className="text-xs text-muted-foreground">Maximum nights an employee can work consecutively</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
