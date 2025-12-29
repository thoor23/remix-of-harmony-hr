import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLocation, CreateLocationInput } from "@/hooks/useLocations";
import { ArrowLeft, Save } from "lucide-react";

const TIMEZONES = [{ value: "Asia/Kolkata", label: "India (IST)" }, { value: "America/New_York", label: "USA Eastern" }, { value: "Europe/London", label: "UK (GMT)" }];
const DATE_FORMATS = [{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }];
const CURRENCIES = [{ value: "INR", label: "₹ INR" }, { value: "USD", label: "$ USD" }, { value: "EUR", label: "€ EUR" }];

export default function AddOffice() {
  const navigate = useNavigate();
  const createOffice = useCreateLocation();
  const [formData, setFormData] = useState<CreateLocationInput>({ name: "", code: "", type: "office", address_street: "", address_city: "", address_state: "", address_zip_code: "", address_country: "", phone: "", email: "", manager_id: undefined, opening_time: "09:00", closing_time: "18:00", is_active: true, timezone: "Asia/Kolkata", date_format: "DD/MM/YYYY", currency: "INR" });

  const handleChange = (field: keyof CreateLocationInput, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await createOffice.mutateAsync(formData); navigate("/admin/locations/offices"); };
  const generateCode = () => { if (formData.name) handleChange("code", "OFF-" + formData.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5)); };

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/admin/locations/offices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Offices
        </Button>
      </div>

      <PageHeader title="Add Office" description="Create a new office location" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card><CardHeader><CardTitle>Basic Information</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Office Name *</Label><Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} onBlur={generateCode} required /></div><div className="space-y-2"><Label>Office Code *</Label><Input value={formData.code} onChange={(e) => handleChange("code", e.target.value.toUpperCase())} required /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Address</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label>Street</Label><Input value={formData.address_street} onChange={(e) => handleChange("address_street", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>City</Label><Input value={formData.address_city} onChange={(e) => handleChange("address_city", e.target.value)} /></div><div className="space-y-2"><Label>Country</Label><Input value={formData.address_country} onChange={(e) => handleChange("address_country", e.target.value)} /></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Regional Settings</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Timezone</Label><Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Date Format</Label><Select value={formData.date_format} onValueChange={(v) => handleChange("date_format", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DATE_FORMATS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Currency</Label><Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Switch checked={formData.is_active} onCheckedChange={(c) => handleChange("is_active", c)} /><Label>Office is active</Label></div></CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/admin/locations/offices")}>Cancel</Button><Button type="submit" disabled={createOffice.isPending}><Save className="h-4 w-4 mr-2" />{createOffice.isPending ? "Creating..." : "Create Office"}</Button></div>
      </form>
    </PageContainer>
  );
}
