import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from "@/data/settingsData";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { useSystemSetting, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemPreferences {
  language: string;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
}

const defaultPreferences: SystemPreferences = {
  language: "English",
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
};

export default function SystemSettingsPage() {
  const { data: settingData, isLoading } = useSystemSetting("system_preferences");
  const updateSetting = useUpdateSystemSetting();
  
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(defaultPreferences);

  // Load settings from database
  useEffect(() => {
    if (settingData?.value) {
      setSystemPreferences({
        ...defaultPreferences,
        ...(settingData.value as unknown as SystemPreferences),
      });
    }
  }, [settingData]);

  const saveSystemPreferences = async () => {
    await updateSetting.mutateAsync({
      key: "system_preferences",
      value: systemPreferences as unknown as Record<string, unknown>,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="System Settings"
          description="Configure language and security settings"
        />
        <div className="grid gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="System Settings"
        description="Configure language and security settings"
      />

      <div className="grid gap-6">
        <SettingsCard
          title="Display Settings"
          description="Language preferences"
          action={
            <Button 
              onClick={saveSystemPreferences}
              disabled={updateSetting.isPending}
            >
              {updateSetting.isPending ? "Saving..." : "Save Changes"}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={systemPreferences.language}
                onValueChange={(value) => setSystemPreferences(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Security Settings"
          description="Session and password policies"
          action={
            <Button 
              onClick={saveSystemPreferences}
              disabled={updateSetting.isPending}
            >
              {updateSetting.isPending ? "Saving..." : "Save Changes"}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={systemPreferences.sessionTimeout}
                onChange={(e) => setSystemPreferences(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password Expiry (days)</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={systemPreferences.passwordExpiryDays}
                onChange={(e) => setSystemPreferences(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) || 90 }))}
              />
              <p className="text-xs text-muted-foreground">Set to 0 to disable password expiry</p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Password Length</Label>
              <Input
                type="number"
                min={6}
                max={32}
                value={systemPreferences.passwordMinLength}
                onChange={(e) => setSystemPreferences(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
              </div>
              <Switch
                checked={systemPreferences.requireSpecialChars}
                onCheckedChange={(checked) => setSystemPreferences(prev => ({ ...prev, requireSpecialChars: checked }))}
              />
            </div>
          </div>
        </SettingsCard>
      </div>
    </PageContainer>
  );
}
