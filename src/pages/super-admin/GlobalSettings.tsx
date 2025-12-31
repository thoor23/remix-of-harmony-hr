import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Database, Shield, Bell, Loader2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface PlatformSetting {
  id: string;
  key: string;
  value: {
    enabled?: boolean;
    plan?: string;
    trial_days?: number;
    minutes?: number;
    attempts?: number;
    lockout_minutes?: number;
    message?: string;
  };
  description: string;
  category: string;
}

export default function GlobalSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, PlatformSetting["value"]>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["super-admin", "platform-settings"],
    queryFn: async () => {
      const response = await api.get<{ data: PlatformSetting[] }>("/super-admin/platform-settings");
      return response.data || [];
    },
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, PlatformSetting["value"]> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      setLocalSettings(settingsMap);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: PlatformSetting["value"] }) => {
      return api.put(`/super-admin/platform-settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "platform-settings"] });
      toast.success("Setting updated successfully");
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update setting");
    },
  });

  const handleToggle = (key: string, field: string, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleNumberChange = (key: string, field: string, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = (key: string) => {
    updateSettingMutation.mutate({ key, value: localSettings[key] });
  };

  const getSetting = (key: string): PlatformSetting["value"] => {
    return localSettings[key] || {};
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Global Settings" description="Configure platform-wide settings" />
        <div className="grid gap-6 max-w-3xl">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Global Settings"
        description="Configure platform-wide settings"
      />
      <div className="grid gap-6 max-w-3xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Configure general platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Self Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new companies to register themselves
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={getSetting("allow_self_registration")?.enabled || false}
                  onCheckedChange={(checked) => handleToggle("allow_self_registration", "enabled", checked)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("allow_self_registration")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Put the platform in maintenance mode
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={getSetting("maintenance_mode")?.enabled || false}
                  onCheckedChange={(checked) => handleToggle("maintenance_mode", "enabled", checked)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("maintenance_mode")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Trial Days</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Number of trial days for new companies
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  value={getSetting("default_subscription_plan")?.trial_days || 14}
                  onChange={(e) => handleNumberChange("default_subscription_plan", "trial_days", parseInt(e.target.value) || 0)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("default_subscription_plan")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Require email verification for new users
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={getSetting("require_email_verification")?.enabled || false}
                  onCheckedChange={(checked) => handleToggle("require_email_verification", "enabled", checked)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("require_email_verification")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Automatically log out inactive users
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  value={getSetting("session_timeout")?.minutes || 60}
                  onChange={(e) => handleNumberChange("session_timeout", "minutes", parseInt(e.target.value) || 60)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("session_timeout")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Number of failed attempts before lockout
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  value={getSetting("max_login_attempts")?.attempts || 5}
                  onChange={(e) => handleNumberChange("max_login_attempts", "attempts", parseInt(e.target.value) || 5)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSave("max_login_attempts")}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure platform notifications (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label>New Company Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new company registers
                </p>
              </div>
              <Switch disabled defaultChecked />
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label>Subscription Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when company subscriptions are expiring
                </p>
              </div>
              <Switch disabled defaultChecked />
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label>System Error Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when system errors occur
                </p>
              </div>
              <Switch disabled defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database & Storage
            </CardTitle>
            <CardDescription>
              Configure database and storage settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Database Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">Connected</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" disabled>
                Export All Data
              </Button>
              <Button variant="outline" disabled>
                Run Backup
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Database operations are managed through the cloud dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
