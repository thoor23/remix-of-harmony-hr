import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Loader2, 
  Save,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
  hasChanges?: boolean;
}

function SettingRow({ label, description, children, onSave, isSaving, hasChanges }: SettingRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
      <div className="space-y-1 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <Button
          size="sm"
          variant={hasChanges ? "default" : "ghost"}
          onClick={onSave}
          disabled={isSaving}
          className="min-w-[80px]"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasChanges ? (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          ) : (
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function GlobalSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, PlatformSetting["value"]>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, PlatformSetting["value"]>>({});
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

  const { data: settings, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["super-admin", "platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category');
      
      if (error) throw error;
      return (data || []) as unknown as PlatformSetting[];
    },
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, PlatformSetting["value"]> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      setLocalSettings(settingsMap);
      setOriginalSettings(settingsMap);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: PlatformSetting["value"] }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "platform-settings"] });
      setOriginalSettings(prev => ({ ...prev, [variables.key]: variables.value }));
      toast.success("Setting updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update setting");
    },
  });

  const handleToggle = (key: string, field: string, value: boolean) => {
    // Special handling for maintenance mode - show confirmation
    if (key === "maintenance_mode" && value === true) {
      setPendingMaintenanceValue(true);
      setMaintenanceDialogOpen(true);
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleConfirmMaintenance = () => {
    setLocalSettings(prev => ({
      ...prev,
      maintenance_mode: { ...prev.maintenance_mode, enabled: true },
    }));
    setMaintenanceDialogOpen(false);
  };

  const handleNumberChange = (key: string, field: string, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = (key: string) => {
    updateSettingMutation.mutate({ key, value: localSettings[key] });
  };

  const getSetting = (key: string): PlatformSetting["value"] => {
    return localSettings[key] || {};
  };

  const hasSettingChanged = (key: string): boolean => {
    return JSON.stringify(localSettings[key]) !== JSON.stringify(originalSettings[key]);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Global Settings" description="Configure platform-wide settings" />
        <div className="grid gap-6 max-w-4xl">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
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
      >
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-6 max-w-4xl">
        {/* General Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              General Settings
            </CardTitle>
            <CardDescription>
              Configure general platform settings and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              <SettingRow
                label="Allow Self Registration"
                description="Allow new companies to register themselves on the platform"
                onSave={() => handleSave("allow_self_registration")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("allow_self_registration")}
              >
                <Switch
                  checked={getSetting("allow_self_registration")?.enabled || false}
                  onCheckedChange={(checked) => handleToggle("allow_self_registration", "enabled", checked)}
                />
              </SettingRow>

              <SettingRow
                label="Maintenance Mode"
                description="Put the platform in maintenance mode - users will see a maintenance page"
                onSave={() => handleSave("maintenance_mode")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("maintenance_mode")}
              >
                <div className="flex items-center gap-2">
                  {getSetting("maintenance_mode")?.enabled && (
                    <span className="text-xs text-warning font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  <Switch
                    checked={getSetting("maintenance_mode")?.enabled || false}
                    onCheckedChange={(checked) => handleToggle("maintenance_mode", "enabled", checked)}
                  />
                </div>
              </SettingRow>

              <SettingRow
                label="Default Trial Days"
                description="Number of trial days for new company registrations"
                onSave={() => handleSave("default_subscription_plan")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("default_subscription_plan")}
              >
                <Input
                  type="number"
                  className="w-20"
                  value={getSetting("default_subscription_plan")?.trial_days || 14}
                  onChange={(e) => handleNumberChange("default_subscription_plan", "trial_days", parseInt(e.target.value) || 0)}
                />
              </SettingRow>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              <SettingRow
                label="Require Email Verification"
                description="Require email verification for new user accounts"
                onSave={() => handleSave("require_email_verification")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("require_email_verification")}
              >
                <Switch
                  checked={getSetting("require_email_verification")?.enabled || false}
                  onCheckedChange={(checked) => handleToggle("require_email_verification", "enabled", checked)}
                />
              </SettingRow>

              <SettingRow
                label="Session Timeout"
                description="Automatically log out inactive users after this many minutes"
                onSave={() => handleSave("session_timeout")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("session_timeout")}
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20"
                    value={getSetting("session_timeout")?.minutes || 60}
                    onChange={(e) => handleNumberChange("session_timeout", "minutes", parseInt(e.target.value) || 60)}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </SettingRow>

              <SettingRow
                label="Max Login Attempts"
                description="Number of failed login attempts before account lockout"
                onSave={() => handleSave("max_login_attempts")}
                isSaving={updateSettingMutation.isPending}
                hasChanges={hasSettingChanged("max_login_attempts")}
              >
                <Input
                  type="number"
                  className="w-20"
                  value={getSetting("max_login_attempts")?.attempts || 5}
                  onChange={(e) => handleNumberChange("max_login_attempts", "attempts", parseInt(e.target.value) || 5)}
                />
              </SettingRow>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-info/10">
                <Bell className="h-5 w-5 text-info" />
              </div>
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure platform notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 opacity-50">
                <div className="space-y-1 flex-1">
                  <Label className="text-sm font-medium">New Company Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new company registers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch disabled defaultChecked />
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 opacity-50">
                <div className="space-y-1 flex-1">
                  <Label className="text-sm font-medium">Subscription Expiry Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when company subscriptions are expiring
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch disabled defaultChecked />
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 opacity-50">
                <div className="space-y-1 flex-1">
                  <Label className="text-sm font-medium">System Error Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when system errors occur
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch disabled defaultChecked />
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database & Storage Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Database className="h-5 w-5 text-success" />
              </div>
              Database & Storage
            </CardTitle>
            <CardDescription>
              View database status and storage settings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Database Status</p>
                  <p className="text-xs text-muted-foreground">Connection status and health</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-success">Connected</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" disabled className="flex-1 sm:flex-none">
                <Database className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="outline" disabled className="flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Backup
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Database operations are managed through the cloud dashboard. Contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode Confirmation Dialog */}
      <AlertDialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Enable Maintenance Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will display a maintenance page to all users and prevent them from accessing the platform.
              Only super admins will be able to access the system while maintenance mode is active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMaintenance} className="bg-warning text-warning-foreground hover:bg-warning/90">
              Enable Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
