import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme, ColorTheme, Mode } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Sun, Moon, Monitor, Palette, Bell, User, Lock, Shield, Mail, Calendar, CreditCard, Megaphone, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    colors: { primary: "hsl(160 84% 39%)", secondary: "hsl(160 20% 96%)", accent: "hsl(160 30% 94%)" },
  },
  {
    id: "glacier",
    name: "Glacier",
    colors: { primary: "hsl(210 80% 50%)", secondary: "hsl(210 30% 96%)", accent: "hsl(210 40% 94%)" },
  },
  {
    id: "harvest",
    name: "Harvest",
    colors: { primary: "hsl(30 90% 50%)", secondary: "hsl(30 30% 96%)", accent: "hsl(30 40% 94%)" },
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: { primary: "hsl(270 70% 55%)", secondary: "hsl(270 30% 96%)", accent: "hsl(270 40% 94%)" },
  },
  {
    id: "brutalist",
    name: "Brutalist",
    colors: { primary: "hsl(0 0% 15%)", secondary: "hsl(0 0% 96%)", accent: "hsl(0 0% 92%)" },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    colors: { primary: "hsl(240 5% 30%)", secondary: "hsl(240 5% 96%)", accent: "hsl(240 5% 92%)" },
  },
  {
    id: "orchid",
    name: "Orchid",
    colors: { primary: "hsl(330 75% 55%)", secondary: "hsl(330 30% 96%)", accent: "hsl(330 40% 94%)" },
  },
  {
    id: "solar",
    name: "Solar",
    colors: { primary: "hsl(45 95% 50%)", secondary: "hsl(45 40% 96%)", accent: "hsl(45 50% 92%)" },
  },
  {
    id: "tide",
    name: "Tide",
    colors: { primary: "hsl(185 80% 40%)", secondary: "hsl(185 30% 96%)", accent: "hsl(185 40% 94%)" },
  },
  {
    id: "verdant",
    name: "Verdant",
    colors: { primary: "hsl(140 60% 35%)", secondary: "hsl(140 25% 96%)", accent: "hsl(140 35% 94%)" },
  },
];

const modeOptions: { id: Mode; name: string; icon: React.ElementType }[] = [
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
  { id: "system", name: "System", icon: Monitor },
];

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

const defaultNotificationPreferences: NotificationPreference[] = [
  { id: "email", label: "Email Notifications", description: "Receive notifications via email", icon: Mail, enabled: true },
  { id: "leaveApproval", label: "Leave Approval Alerts", description: "Get notified when leave requests are approved or rejected", icon: Calendar, enabled: true },
  { id: "attendance", label: "Attendance Reminders", description: "Daily reminders to clock in/out", icon: Shield, enabled: true },
  { id: "birthday", label: "Birthday Announcements", description: "Celebrate team member birthdays", icon: Megaphone, enabled: true },
  { id: "payslip", label: "Payslip Notifications", description: "Get notified when new payslips are available", icon: CreditCard, enabled: true },
  { id: "system", label: "System Updates", description: "Important system announcements and updates", icon: Settings2, enabled: true },
];

export default function PersonalSettingsPage() {
  const { colorTheme, mode, setColorTheme, setMode } = useTheme();
  const { user, profile } = useAuth();
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleNotification = (id: string) => {
    setNotificationPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    toast.success("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split("@")[0] || "User";

  return (
    <PageContainer>
      <PageHeader
        title="Personal Settings"
        description="Customize your personal experience and preferences"
      />

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Mode</CardTitle>
              <CardDescription>Choose between light, dark, or system mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {modeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setMode(option.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:bg-muted/50",
                      mode === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <option.icon className={cn(
                      "h-6 w-6",
                      mode === option.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      mode === option.id ? "text-primary" : "text-foreground"
                    )}>
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
              <CardDescription>Select a color theme for your portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id)}
                    className={cn(
                      "relative flex flex-col gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                      colorTheme === theme.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    {colorTheme === theme.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className="flex gap-1.5 p-2 rounded-md bg-muted/30">
                      <div
                        className="h-8 w-8 rounded-md shadow-sm"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="h-8 w-4 rounded-md shadow-sm border"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div
                        className="h-8 w-4 rounded-md shadow-sm border"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    
                    <Label className="text-center text-sm font-medium cursor-pointer">
                      {theme.name}
                    </Label>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationPreferences.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <pref.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor={pref.id} className="text-sm font-medium cursor-pointer">
                        {pref.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
                    </div>
                  </div>
                  <Switch
                    id={pref.id}
                    checked={pref.enabled}
                    onCheckedChange={() => toggleNotification(pref.id)}
                  />
                </div>
              ))}
              
              <div className="pt-4">
                <Button onClick={handleSaveNotifications}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{displayName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email || "Not available"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button onClick={handleChangePassword} className="mt-4">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
