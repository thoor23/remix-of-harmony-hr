import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { defaultSystemPreferences, languages } from "@/data/settingsData";
import { SystemPreferences } from "@/types/settings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(defaultSystemPreferences);

  const saveSystemPreferences = () => {
    toast.success("System preferences saved successfully");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[
        { label: "Settings", href: "/admin/settings/departments" },
        { label: "System" }
      ]} />

      <PageHeader
        title="System Settings"
        description="Configure language and security settings"
      />

      <div className="grid gap-6">
        <SettingsCard
          title="Display Settings"
          description="Language preferences"
          action={<Button onClick={saveSystemPreferences}>Save Changes</Button>}
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