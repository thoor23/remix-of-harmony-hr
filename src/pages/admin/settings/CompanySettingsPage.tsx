import { useState, useRef, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  timezones,
  dateFormats,
  currencies,
} from "@/data/settingsData";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { 
  useCompanyBranding, 
  useUpdateCompanyBranding, 
  useUploadCompanyLogo,
  useDeleteCompanyLogo,
  CompanyBranding 
} from "@/hooks/useCompanyBranding";
import { Loader2, Upload, X, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CompanySettingsPage() {
  const { data: branding, isLoading } = useCompanyBranding();
  const updateBranding = useUpdateCompanyBranding();
  const uploadLogo = useUploadCompanyLogo();
  const deleteLogo = useDeleteCompanyLogo();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CompanyBranding>({
    companyName: "",
    companyLogo: null,
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyWebsite: "",
  });

  const [regionalSettings, setRegionalSettings] = useState({
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    financialYearStart: "April",
  });

  // Sync form data with fetched branding
  useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    try {
      const logoUrl = await uploadLogo.mutateAsync(file);
      await updateBranding.mutateAsync({ companyLogo: logoUrl });
      setFormData(prev => ({ ...prev, companyLogo: logoUrl }));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await deleteLogo.mutateAsync();
      await updateBranding.mutateAsync({ companyLogo: null });
      setFormData(prev => ({ ...prev, companyLogo: null }));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const saveCompanySettings = async () => {
    await updateBranding.mutateAsync({
      companyName: formData.companyName,
      companyEmail: formData.companyEmail,
      companyPhone: formData.companyPhone,
      companyAddress: formData.companyAddress,
      companyWebsite: formData.companyWebsite,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Company Settings"
        description="Manage company information, branding, and regional settings"
      />

      <div className="grid gap-6">
        {/* Logo Upload Section */}
        <SettingsCard
          title="Company Logo"
          description="Upload your company logo to display across the application"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-lg">
                <AvatarImage src={formData.companyLogo || undefined} alt="Company logo" />
                <AvatarFallback className="rounded-lg bg-primary/10">
                  <Building2 className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              {formData.companyLogo && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                  disabled={deleteLogo.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending}
              >
                {uploadLogo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG or WebP. Max 2MB.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Company Information */}
        <SettingsCard
          title="Company Information"
          description="Basic information about your organization"
          action={
            <Button 
              onClick={saveCompanySettings}
              disabled={updateBranding.isPending}
            >
              {updateBranding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="contact@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.companyPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.companyWebsite}
                onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={formData.companyAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                rows={2}
                placeholder="123 Business Street, City, Country"
              />
            </div>
          </div>
        </SettingsCard>

        {/* Regional Settings */}
        <SettingsCard
          title="Regional Settings"
          description="Configure timezone, currency, and date formats"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={regionalSettings.timezone}
                onValueChange={(value) => setRegionalSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={regionalSettings.dateFormat}
                onValueChange={(value) => setRegionalSettings(prev => ({ ...prev, dateFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={regionalSettings.currency}
                onValueChange={(value) => setRegionalSettings(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Financial Year Starts</Label>
              <Select
                value={regionalSettings.financialYearStart}
                onValueChange={(value) => setRegionalSettings(prev => ({ ...prev, financialYearStart: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["January", "April", "July", "October"].map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsCard>
      </div>
    </PageContainer>
  );
}
