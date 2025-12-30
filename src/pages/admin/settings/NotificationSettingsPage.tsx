import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useSystemSetting, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationSettings {
  emailNotifications: boolean;
  leaveApprovalAlerts: boolean;
  attendanceReminders: boolean;
  birthdayAnnouncements: boolean;
  payslipNotifications: boolean;
  systemUpdates: boolean;
}

const defaultSettings: NotificationSettings = {
  emailNotifications: true,
  leaveApprovalAlerts: true,
  attendanceReminders: true,
  birthdayAnnouncements: true,
  payslipNotifications: true,
  systemUpdates: true,
};

export default function NotificationSettingsPage() {
  const { data: settingData, isLoading } = useSystemSetting("notification_settings");
  const updateSetting = useUpdateSystemSetting();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings);

  // Load settings from database
  useEffect(() => {
    if (settingData?.value) {
      setNotificationSettings({
        ...defaultSettings,
        ...(settingData.value as unknown as NotificationSettings),
      });
    }
  }, [settingData]);

  const saveNotificationSettings = async () => {
    await updateSetting.mutateAsync({
      key: "notification_settings",
      value: notificationSettings as unknown as Record<string, unknown>,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Notification Settings"
          description="Configure email and in-app notification preferences"
        />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Notification Settings"
        description="Configure email and in-app notification preferences"
      />

      <SettingsCard
        title="Notification Preferences"
        description="Configure email and in-app notification settings"
        action={
          <Button 
            onClick={saveNotificationSettings}
            disabled={updateSetting.isPending}
          >
            {updateSetting.isPending ? "Saving..." : "Save Changes"}
          </Button>
        }
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
