import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, RefreshCw, ArrowLeftRight, Moon, Coffee, DollarSign } from "lucide-react";

interface ShiftChangeRule {
  minNoticePeriodDays: number;
  requireApproval: boolean;
  maxChangesPerMonth: number;
  allowSameDayChange: boolean;
}

interface OvertimePolicy {
  minHoursBeforeOT: number;
  otStartsAfter: string;
  weekdayMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
}

interface BreakPolicy {
  mandatoryBreakAfterHours: number;
  minBreakDuration: number;
  maxBreakDuration: number;
  paidBreak: boolean;
}

interface RotationRule {
  enableAutoRotation: boolean;
  rotationFrequency: string;
  noticeBeforeRotation: number;
  fairnessCheck: boolean;
}

interface ExchangeRule {
  allowExchange: boolean;
  requireBothApproval: boolean;
  requireManagerApproval: boolean;
  minExchangeNotice: number;
  sameDepartmentOnly: boolean;
}

interface NightShiftPolicy {
  nightShiftStartTime: string;
  nightShiftEndTime: string;
  nightShiftAllowance: number;
  allowanceType: string;
  maxConsecutiveNights: number;
}

export default function ShiftPolicyPage() {
  const [shiftChangeRules, setShiftChangeRules] = useState<ShiftChangeRule>({
    minNoticePeriodDays: 7,
    requireApproval: true,
    maxChangesPerMonth: 2,
    allowSameDayChange: false,
  });

  const [overtimePolicy, setOvertimePolicy] = useState<OvertimePolicy>({
    minHoursBeforeOT: 8,
    otStartsAfter: "18:00",
    weekdayMultiplier: 1.5,
    weekendMultiplier: 2,
    holidayMultiplier: 2.5,
  });

  const [breakPolicy, setBreakPolicy] = useState<BreakPolicy>({
    mandatoryBreakAfterHours: 4,
    minBreakDuration: 30,
    maxBreakDuration: 60,
    paidBreak: true,
  });

  const [rotationRules, setRotationRules] = useState<RotationRule>({
    enableAutoRotation: true,
    rotationFrequency: "weekly",
    noticeBeforeRotation: 3,
    fairnessCheck: true,
  });

  const [exchangeRules, setExchangeRules] = useState<ExchangeRule>({
    allowExchange: true,
    requireBothApproval: true,
    requireManagerApproval: true,
    minExchangeNotice: 24,
    sameDepartmentOnly: false,
  });

  const [nightShiftPolicy, setNightShiftPolicy] = useState<NightShiftPolicy>({
    nightShiftStartTime: "22:00",
    nightShiftEndTime: "06:00",
    nightShiftAllowance: 500,
    allowanceType: "fixed",
    maxConsecutiveNights: 5,
  });

  const saveSettings = () => {
    toast.success("Shift policy saved successfully");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Shift Policy & Rules"
        description="Configure shift changes, overtime, breaks, rotations, and exchange policies"
      >
        <Button onClick={saveSettings}>Save All Changes</Button>
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
                    value={shiftChangeRules.minNoticePeriodDays}
                    onChange={(e) => setShiftChangeRules(prev => ({ ...prev, minNoticePeriodDays: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Days notice required before shift change</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Changes Per Month</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={shiftChangeRules.maxChangesPerMonth}
                    onChange={(e) => setShiftChangeRules(prev => ({ ...prev, maxChangesPerMonth: parseInt(e.target.value) || 0 }))}
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
                  checked={shiftChangeRules.requireApproval}
                  onCheckedChange={(checked) => setShiftChangeRules(prev => ({ ...prev, requireApproval: checked }))}
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
                  checked={shiftChangeRules.allowSameDayChange}
                  onCheckedChange={(checked) => setShiftChangeRules(prev => ({ ...prev, allowSameDayChange: checked }))}
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
                    value={overtimePolicy.minHoursBeforeOT}
                    onChange={(e) => setOvertimePolicy(prev => ({ ...prev, minHoursBeforeOT: parseInt(e.target.value) || 8 }))}
                  />
                  <p className="text-xs text-muted-foreground">Work hours before overtime kicks in</p>
                </div>
                <div className="space-y-2">
                  <Label>OT Starts After</Label>
                  <Input
                    type="time"
                    value={overtimePolicy.otStartsAfter}
                    onChange={(e) => setOvertimePolicy(prev => ({ ...prev, otStartsAfter: e.target.value }))}
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
                    value={overtimePolicy.weekdayMultiplier}
                    onChange={(e) => setOvertimePolicy(prev => ({ ...prev, weekdayMultiplier: parseFloat(e.target.value) || 1.5 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekend Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={4}
                    value={overtimePolicy.weekendMultiplier}
                    onChange={(e) => setOvertimePolicy(prev => ({ ...prev, weekendMultiplier: parseFloat(e.target.value) || 2 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Holiday Multiplier</Label>
                  <Input
                    type="number"
                    step={0.25}
                    min={1}
                    max={4}
                    value={overtimePolicy.holidayMultiplier}
                    onChange={(e) => setOvertimePolicy(prev => ({ ...prev, holidayMultiplier: parseFloat(e.target.value) || 2.5 }))}
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
                    value={breakPolicy.mandatoryBreakAfterHours}
                    onChange={(e) => setBreakPolicy(prev => ({ ...prev, mandatoryBreakAfterHours: parseInt(e.target.value) || 4 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Break Duration (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={60}
                    value={breakPolicy.minBreakDuration}
                    onChange={(e) => setBreakPolicy(prev => ({ ...prev, minBreakDuration: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Break Duration (min)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={120}
                    value={breakPolicy.maxBreakDuration}
                    onChange={(e) => setBreakPolicy(prev => ({ ...prev, maxBreakDuration: parseInt(e.target.value) || 60 }))}
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
                  checked={breakPolicy.paidBreak}
                  onCheckedChange={(checked) => setBreakPolicy(prev => ({ ...prev, paidBreak: checked }))}
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
                  checked={rotationRules.enableAutoRotation}
                  onCheckedChange={(checked) => setRotationRules(prev => ({ ...prev, enableAutoRotation: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rotation Frequency</Label>
                  <Select 
                    value={rotationRules.rotationFrequency} 
                    onValueChange={(value) => setRotationRules(prev => ({ ...prev, rotationFrequency: value }))}
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
                    value={rotationRules.noticeBeforeRotation}
                    onChange={(e) => setRotationRules(prev => ({ ...prev, noticeBeforeRotation: parseInt(e.target.value) || 3 }))}
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
                  checked={rotationRules.fairnessCheck}
                  onCheckedChange={(checked) => setRotationRules(prev => ({ ...prev, fairnessCheck: checked }))}
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
                  checked={exchangeRules.allowExchange}
                  onCheckedChange={(checked) => setExchangeRules(prev => ({ ...prev, allowExchange: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Exchange Notice (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={exchangeRules.minExchangeNotice}
                  onChange={(e) => setExchangeRules(prev => ({ ...prev, minExchangeNotice: parseInt(e.target.value) || 24 }))}
                />
                <p className="text-xs text-muted-foreground">Hours notice required before shift exchange</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Both Employee Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Both employees must approve the exchange
                  </p>
                </div>
                <Switch
                  checked={exchangeRules.requireBothApproval}
                  onCheckedChange={(checked) => setExchangeRules(prev => ({ ...prev, requireBothApproval: checked }))}
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
                  checked={exchangeRules.requireManagerApproval}
                  onCheckedChange={(checked) => setExchangeRules(prev => ({ ...prev, requireManagerApproval: checked }))}
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
                  checked={exchangeRules.sameDepartmentOnly}
                  onCheckedChange={(checked) => setExchangeRules(prev => ({ ...prev, sameDepartmentOnly: checked }))}
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
                Night Shift Allowances
              </CardTitle>
              <CardDescription>Configure night shift timing and compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Night Shift Start Time</Label>
                  <Input
                    type="time"
                    value={nightShiftPolicy.nightShiftStartTime}
                    onChange={(e) => setNightShiftPolicy(prev => ({ ...prev, nightShiftStartTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Night Shift End Time</Label>
                  <Input
                    type="time"
                    value={nightShiftPolicy.nightShiftEndTime}
                    onChange={(e) => setNightShiftPolicy(prev => ({ ...prev, nightShiftEndTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Allowance Type</Label>
                  <Select 
                    value={nightShiftPolicy.allowanceType} 
                    onValueChange={(value) => setNightShiftPolicy(prev => ({ ...prev, allowanceType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage of Base</SelectItem>
                      <SelectItem value="hourly">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Night Shift Allowance</Label>
                  <Input
                    type="number"
                    min={0}
                    value={nightShiftPolicy.nightShiftAllowance}
                    onChange={(e) => setNightShiftPolicy(prev => ({ ...prev, nightShiftAllowance: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {nightShiftPolicy.allowanceType === "percentage" ? "%" : "₹"} per shift
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Consecutive Night Shifts</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={nightShiftPolicy.maxConsecutiveNights}
                  onChange={(e) => setNightShiftPolicy(prev => ({ ...prev, maxConsecutiveNights: parseInt(e.target.value) || 5 }))}
                />
                <p className="text-xs text-muted-foreground">Maximum consecutive night shifts allowed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
