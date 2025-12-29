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
  useUploadFavicon,
  useDeleteFavicon,
  CompanyBranding,
} from "@/hooks/useCompanyBranding";
import { Loader2, Upload, X, Building2, Image, Italic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";

export default function CompanySettingsPage() {
  const { data: branding, isLoading } = useCompanyBranding();
  const updateBranding = useUpdateCompanyBranding();
  const uploadLogo = useUploadCompanyLogo();
  const deleteLogo = useDeleteCompanyLogo();
  const uploadFavicon = useUploadFavicon();
  const deleteFavicon = useDeleteFavicon();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CompanyBranding>({
    companyName: "",
    companyLogo: null,
    companyFavicon: null,
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyWebsite: "",
    logoSize: 32,
    nameSize: 18,
    nameFontWeight: "semibold",
    nameItalic: false,
  });

  const [regionalSettings, setRegionalSettings] = useState({
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    financialYearStart: "April",
  });

  useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;

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

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/x-icon", "image/svg+xml", "image/ico"];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) return;
    if (file.size > 1 * 1024 * 1024) return;

    try {
      const faviconUrl = await uploadFavicon.mutateAsync(file);
      await updateBranding.mutateAsync({ companyFavicon: faviconUrl });
      setFormData(prev => ({ ...prev, companyFavicon: faviconUrl }));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      await deleteFavicon.mutateAsync();
      await updateBranding.mutateAsync({ companyFavicon: null });
      setFormData(prev => ({ ...prev, companyFavicon: null }));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLogoSizeChange = (value: number[]) => {
    const size = value[0];
    setFormData(prev => ({ ...prev, logoSize: size }));
  };

  const handleLogoSizeCommit = async (value: number[]) => {
    const size = value[0];
    await updateBranding.mutateAsync({ logoSize: size });
  };

  const handleNameSizeChange = (value: number[]) => {
    const size = value[0];
    setFormData(prev => ({ ...prev, nameSize: size }));
  };

  const handleNameSizeCommit = async (value: number[]) => {
    const size = value[0];
    await updateBranding.mutateAsync({ nameSize: size });
  };

  const handleFontWeightChange = async (weight: CompanyBranding["nameFontWeight"]) => {
    setFormData(prev => ({ ...prev, nameFontWeight: weight }));
    await updateBranding.mutateAsync({ nameFontWeight: weight });
  };

  const handleItalicToggle = async () => {
    const newValue = !formData.nameItalic;
    setFormData(prev => ({ ...prev, nameItalic: newValue }));
    await updateBranding.mutateAsync({ nameItalic: newValue });
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

  const fontWeightClass = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
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
        {/* Logo & Favicon Upload Section - Combined */}
        <SettingsCard
          title="Company Logo & Favicon"
          description="Upload your company logo and favicon for branding"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={formData.companyLogo || undefined} alt="Company logo" />
                    <AvatarFallback className="rounded-lg bg-primary/10">
                      <Building2 className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  {formData.companyLogo && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                      onClick={handleRemoveLogo}
                      disabled={deleteLogo.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                  >
                    {uploadLogo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="mr-1 h-3 w-3" />
                        Upload
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG. Max 2MB</p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Favicon</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    {formData.companyFavicon ? (
                      <img 
                        src={formData.companyFavicon} 
                        alt="Favicon" 
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  {formData.companyFavicon && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                      onClick={handleRemoveFavicon}
                      disabled={deleteFavicon.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="file"
                    ref={faviconInputRef}
                    onChange={handleFaviconUpload}
                    accept="image/png,image/x-icon,image/svg+xml,.ico"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadFavicon.isPending}
                  >
                    {uploadFavicon.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="mr-1 h-3 w-3" />
                        Upload
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, ICO, SVG. Max 1MB</p>
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Size Settings - Combined */}
        <SettingsCard
          title="Sidebar Display Settings"
          description="Customize logo and company name appearance in the sidebar"
        >
          <div className="space-y-6">
            {/* Preview */}
            <div className="p-4 rounded-lg border bg-sidebar">
              <div className="flex items-center gap-2">
                <Avatar 
                  className="rounded-lg flex-shrink-0"
                  style={{ width: formData.logoSize, height: formData.logoSize }}
                >
                  <AvatarImage src={formData.companyLogo || undefined} alt="Preview" />
                  <AvatarFallback className="rounded-lg bg-primary">
                    <Building2 style={{ width: formData.logoSize / 2, height: formData.logoSize / 2 }} className="text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span 
                  className={`truncate ${fontWeightClass[formData.nameFontWeight]} ${formData.nameItalic ? 'italic' : ''}`}
                  style={{ fontSize: formData.nameSize }}
                >
                  {formData.companyName || "Company Name"}
                </span>
              </div>
            </div>

            {/* Size Controls - Both in one row */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo Size */}
              <div className="space-y-2">
                <Label>Logo Size ({formData.logoSize}px)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[formData.logoSize]}
                    onValueChange={handleLogoSizeChange}
                    onValueCommit={handleLogoSizeCommit}
                    min={24}
                    max={40}
                    step={2}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={formData.logoSize}
                    onChange={(e) => {
                      const val = Math.min(40, Math.max(24, Number(e.target.value)));
                      handleLogoSizeChange([val]);
                    }}
                    onBlur={() => handleLogoSizeCommit([formData.logoSize])}
                    min={24}
                    max={40}
                    className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Name Size */}
              <div className="space-y-2">
                <Label>Name Size ({formData.nameSize}px)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[formData.nameSize]}
                    onValueChange={handleNameSizeChange}
                    onValueCommit={handleNameSizeCommit}
                    min={12}
                    max={22}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={formData.nameSize}
                    onChange={(e) => {
                      const val = Math.min(22, Math.max(12, Number(e.target.value)));
                      handleNameSizeChange([val]);
                    }}
                    onBlur={() => handleNameSizeCommit([formData.nameSize])}
                    min={12}
                    max={22}
                    className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Font Style Controls */}
            <div className="space-y-2">
              <Label>Font Style</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={formData.nameFontWeight}
                  onValueChange={(value) => handleFontWeightChange(value as CompanyBranding["nameFontWeight"])}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
                <Toggle 
                  pressed={formData.nameItalic} 
                  onPressedChange={handleItalicToggle}
                  aria-label="Toggle italic"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
              </div>
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
