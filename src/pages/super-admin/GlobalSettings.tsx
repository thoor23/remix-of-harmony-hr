import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Database, Shield, Bell } from "lucide-react";

export default function GlobalSettings() {
  return (
    <PageContainer
      title="Global Settings"
      description="Configure platform-wide settings"
    >
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
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Require email verification for new users
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Put the platform in maintenance mode
                </p>
              </div>
              <Switch />
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
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all super admins
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 24 hours
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict super admin access to specific IPs
                </p>
              </div>
              <Switch />
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
              Configure platform notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Company Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new company registers
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Subscription Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when company subscriptions are expiring
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Error Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when system errors occur
                </p>
              </div>
              <Switch defaultChecked />
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
