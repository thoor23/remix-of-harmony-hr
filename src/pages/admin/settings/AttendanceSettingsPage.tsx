import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultAttendanceSettings, weekDays } from "@/data/settingsData";
import { AttendanceSettings } from "@/types/settings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { toast } from "sonner";

export default function AttendanceSettingsPage() {
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>(defaultAttendanceSettings);

  const saveAttendanceSettings = () => {
    toast.success("Attendance settings saved successfully");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[
        { label: "Settings", href: "/admin/settings/departments" },
        { label: "Attendance" }
      ]} />

      <PageHeader
        title="Attendance Settings"
        description="Configure working hours, grace periods, and overtime settings"
      />

      <SettingsCard
        title="Attendance Configuration"
        description="Set up working hours, grace periods, and overtime settings"
        action={<Button onClick={saveAttendanceSettings}>Save Changes</Button>}
      >
        <div className="grid gap-6">
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
              <Label>Grace Period (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={attendanceSettings.graceMinutes}
                onChange={(e) => setAttendanceSettings(prev => ({ ...prev, graceMinutes: parseInt(e.target.value) || 0 }))}
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
              <Label>Auto Checkout Time</Label>
              <Input
                type="time"
                value={attendanceSettings.autoCheckoutTime}
                onChange={(e) => setAttendanceSettings(prev => ({ ...prev, autoCheckoutTime: e.target.value }))}
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
        </div>
      </SettingsCard>
    </PageContainer>
  );
}