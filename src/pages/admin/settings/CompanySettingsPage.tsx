import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
  defaultCompanySettings,
  timezones,
  dateFormats,
  currencies,
} from "@/data/settingsData";
import { CompanySettings } from "@/types/settings";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { toast } from "sonner";

export default function CompanySettingsPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);

  const saveCompanySettings = () => {
    toast.success("Company settings saved successfully");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[
        { label: "Settings", href: "/admin/settings/departments" },
        { label: "Company" }
      ]} />

      <PageHeader
        title="Company Settings"
        description="Manage company information and regional settings"
      />

      <div className="grid gap-6">
        <SettingsCard
          title="Company Information"
          description="Basic information about your organization"
          action={<Button onClick={saveCompanySettings}>Save Changes</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={companySettings.phone}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={companySettings.website}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={companySettings.address}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Regional Settings"
          description="Configure timezone, currency, and date formats"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={companySettings.timezone}
                onValueChange={(value) => setCompanySettings(prev => ({ ...prev, timezone: value }))}
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
                value={companySettings.dateFormat}
                onValueChange={(value) => setCompanySettings(prev => ({ ...prev, dateFormat: value }))}
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
                value={companySettings.currency}
                onValueChange={(value) => setCompanySettings(prev => ({ ...prev, currency: value }))}
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
                value={companySettings.financialYearStart}
                onValueChange={(value) => setCompanySettings(prev => ({ ...prev, financialYearStart: value }))}
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