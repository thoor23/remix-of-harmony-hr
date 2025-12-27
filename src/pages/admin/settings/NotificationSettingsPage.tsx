import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultNotificationSettings } from "@/data/settingsData";
import { NotificationSettings } from "@/types/settings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { toast } from "sonner";

export default function NotificationSettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const saveNotificationSettings = () => {
    toast.success("Notification settings saved successfully");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[
        { label: "Settings", href: "/admin/settings/departments" },
        { label: "Notifications" }
      ]} />

      <PageHeader
        title="Notification Settings"
        description="Configure email and in-app notification preferences"
      />

      <SettingsCard
        title="Notification Preferences"
        description="Configure email and in-app notification settings"
        action={<Button onClick={saveNotificationSettings}>Save Changes</Button>}
      >
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'leaveApprovalAlerts', label: 'Leave Approval Alerts', desc: 'Get notified when leave requests need approval or are approved/rejected' },
            { key: 'attendanceReminders', label: 'Attendance Reminders', desc: 'Daily reminders for check-in and check-out' },
            { key: 'birthdayAnnouncements', label: 'Birthday Announcements', desc: 'Celebrate team birthdays with announcements' },
            { key: 'payslipNotifications', label: 'Payslip Notifications', desc: 'Notify employees when payslips are generated' },
            { key: 'systemUpdates', label: 'System Updates', desc: 'Receive notifications about system maintenance and updates' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notificationSettings[item.key as keyof NotificationSettings]}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </SettingsCard>
    </PageContainer>
  );
}