import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation as useLocationData, useUpdateLocation, CreateLocationInput } from "@/hooks/useLocations";
import { ArrowLeft, Save } from "lucide-react";

const TIMEZONES = [{ value: "Asia/Kolkata", label: "India (IST)" }, { value: "America/New_York", label: "USA Eastern" }];
const DATE_FORMATS = [{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }];
const CURRENCIES = [{ value: "INR", label: "₹ INR" }, { value: "USD", label: "$ USD" }];

export default function EditOffice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: office, isLoading } = useLocationData(id || "");
  const updateOffice = useUpdateLocation();
  const [formData, setFormData] = useState<CreateLocationInput>({ name: "", code: "", type: "office", address_street: "", address_city: "", address_state: "", address_zip_code: "", address_country: "", phone: "", email: "", is_active: true, timezone: "Asia/Kolkata", date_format: "DD/MM/YYYY", currency: "INR" });

  useEffect(() => { if (office) setFormData({ name: office.name, code: office.code, type: "office", address_street: office.address_street || "", address_city: office.address_city || "", address_state: office.address_state || "", address_zip_code: office.address_zip_code || "", address_country: office.address_country || "", phone: office.phone || "", email: office.email || "", is_active: office.is_active, timezone: office.timezone || "Asia/Kolkata", date_format: office.date_format || "DD/MM/YYYY", currency: office.currency || "INR" }); }, [office]);

  const handleChange = (field: keyof CreateLocationInput, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!id) return; await updateOffice.mutateAsync({ id, ...formData }); navigate(`/app/locations/offices/${id}`); };

  if (isLoading) return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(`/app/locations/offices/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Office Details
        </Button>
      </div>
      <PageHeader title="Edit Office" />
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );

  if (!office) return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/app/locations/offices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Offices
        </Button>
      </div>
      <PageHeader title="Office Not Found" />
    </PageContainer>
  );

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(`/app/locations/offices/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Office Details
        </Button>
      </div>

      <PageHeader title={`Edit ${office.name}`} description="Update office information" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card><CardHeader><CardTitle>Basic Information</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required /></div><div className="space-y-2"><Label>Code *</Label><Input value={formData.code} onChange={(e) => handleChange("code", e.target.value.toUpperCase())} required /></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Regional Settings</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Timezone</Label><Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Date Format</Label><Select value={formData.date_format} onValueChange={(v) => handleChange("date_format", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DATE_FORMATS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Currency</Label><Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Switch checked={formData.is_active} onCheckedChange={(c) => handleChange("is_active", c)} /><Label>Active</Label></div></CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate(`/app/locations/offices/${id}`)}>Cancel</Button><Button type="submit" disabled={updateOffice.isPending}><Save className="h-4 w-4 mr-2" />{updateOffice.isPending ? "Saving..." : "Save"}</Button></div>
      </form>
    </PageContainer>
  );
}
