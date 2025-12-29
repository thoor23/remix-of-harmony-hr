import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Info,
  Server,
  Key
} from "lucide-react";
import { useEmailConfig, useUpdateEmailConfig, useSendTestEmail, smtpPresets, type EmailConfig, type SmtpPresetKey } from "@/hooks/useEmailSettings";
import { format } from "date-fns";
import { WaveLoader } from "@/components/shared/LoadingSkeletons";

export default function EmailSettingsPage() {
  const { data: emailConfig, isLoading } = useEmailConfig();
  const updateConfig = useUpdateEmailConfig();
  const sendTestEmail = useSendTestEmail();

  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<SmtpPresetKey>("gmail");

  useEffect(() => {
    if (emailConfig) {
      setConfig(emailConfig);
      // Determine preset based on current host
      const preset = Object.entries(smtpPresets).find(
        ([_, p]) => p.host === emailConfig.smtpHost
      );
      if (preset) {
        setSelectedPreset(preset[0] as SmtpPresetKey);
      } else if (emailConfig.smtpHost) {
        setSelectedPreset("custom");
      }
    }
  }, [emailConfig]);

  if (isLoading || !config) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <WaveLoader size="lg" />
        </div>
      </PageContainer>
    );
  }

  const handleSave = () => {
    updateConfig.mutate(config);
  };

  const handlePresetChange = (preset: SmtpPresetKey) => {
    setSelectedPreset(preset);
    const presetConfig = smtpPresets[preset];
    setConfig({
      ...config,
      smtpHost: presetConfig.host,
      smtpPort: presetConfig.port,
      smtpSecure: presetConfig.secure,
    });
  };

  const handleTestEmail = () => {
    if (!testEmail) return;
    sendTestEmail.mutate({ recipientEmail: testEmail, config });
  };

  const isConfigValid = config.provider === "resend" 
    ? config.resendApiKey && config.resendFromEmail
    : config.smtpHost && config.smtpUser && config.smtpPassword;

  return (
    <PageContainer>
      <PageHeader 
        title="Email Settings" 
        description="Configure email provider and test email delivery"
      />
      <div className="space-y-6">
        {/* Enable/Disable Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Enable or disable email notifications globally
                </CardDescription>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Email Provider</CardTitle>
            <CardDescription>
              Choose how you want to send emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={config.provider} 
              onValueChange={(value) => setConfig({ ...config, provider: value as "resend" | "smtp" })}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="resend" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Resend API
                </TabsTrigger>
                <TabsTrigger value="smtp" className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  SMTP (App Password)
                </TabsTrigger>
              </TabsList>

              {/* Resend Configuration */}
              <TabsContent value="resend" className="space-y-4 mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Resend is a modern email API. You'll need to{" "}
                    <a 
                      href="https://resend.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium underline inline-flex items-center gap-1"
                    >
                      create an account <ExternalLink className="h-3 w-3" />
                    </a>
                    {" "}and{" "}
                    <a 
                      href="https://resend.com/domains" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium underline inline-flex items-center gap-1"
                    >
                      verify your domain <ExternalLink className="h-3 w-3" />
                    </a>
                    .
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="resendApiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={config.resendApiKey}
                        onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://resend.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        resend.com/api-keys
                      </a>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resendFromEmail">From Email</Label>
                      <Input
                        id="resendFromEmail"
                        type="email"
                        placeholder="noreply@yourdomain.com"
                        value={config.resendFromEmail}
                        onChange={(e) => setConfig({ ...config, resendFromEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resendFromName">From Name</Label>
                      <Input
                        id="resendFromName"
                        placeholder="Full Circle HRMS"
                        value={config.resendFromName}
                        onChange={(e) => setConfig({ ...config, resendFromName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SMTP Configuration */}
              <TabsContent value="smtp" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Provider Preset</Label>
                    <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as SmtpPresetKey)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(smtpPresets).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {smtpPresets[selectedPreset]?.helpUrl && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You need to create an App Password for {smtpPresets[selectedPreset].name}.{" "}
                        <a 
                          href={smtpPresets[selectedPreset].helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium underline inline-flex items-center gap-1"
                        >
                          Learn how <ExternalLink className="h-3 w-3" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        placeholder="smtp.gmail.com"
                        value={config.smtpHost}
                        onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                        disabled={selectedPreset !== "custom"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        placeholder="587"
                        value={config.smtpPort}
                        onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                        disabled={selectedPreset !== "custom"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Email Address (Username)</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={config.smtpUser}
                      onChange={(e) => setConfig({ ...config, smtpUser: e.target.value, smtpFromEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">App Password</Label>
                    <div className="relative">
                      <Input
                        id="smtpPassword"
                        type={showSmtpPassword ? "text" : "password"}
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={config.smtpPassword}
                        onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      >
                        {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is NOT your regular email password. Create an App Password from your email provider.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpFromName">From Name</Label>
                    <Input
                      id="smtpFromName"
                      placeholder="Full Circle HRMS"
                      value={config.smtpFromName}
                      onChange={(e) => setConfig({ ...config, smtpFromName: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpSecure"
                      checked={config.smtpSecure}
                      onCheckedChange={(checked) => setConfig({ ...config, smtpSecure: checked })}
                      disabled={selectedPreset !== "custom"}
                    />
                    <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateConfig.isPending}>
                {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Email Configuration
            </CardTitle>
            <CardDescription>
              Send a test email to verify your configuration is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConfigValid && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>
                  Please complete the email configuration above before sending a test email.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="testEmail">Recipient Email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleTestEmail} 
                  disabled={!testEmail || !isConfigValid || sendTestEmail.isPending}
                >
                  {sendTestEmail.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Test Email
                </Button>
              </div>
            </div>

            {config.lastTestedAt && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                {config.lastTestStatus === "success" ? (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="mr-1 h-3 w-3" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <X className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Last tested: {format(new Date(config.lastTestedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {config.lastTestMessage && (
                  <span className="text-sm">— {config.lastTestMessage}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
