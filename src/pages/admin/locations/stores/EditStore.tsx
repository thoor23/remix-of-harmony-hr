import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation as useLocationData, useUpdateLocation, CreateLocationInput } from "@/hooks/useLocations";
import { useEmployees } from "@/hooks/useEmployees";
import { ArrowLeft, Save } from "lucide-react";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "USA Eastern (EST/EDT)" },
  { value: "America/Chicago", label: "USA Central (CST/CDT)" },
  { value: "America/Denver", label: "USA Mountain (MST/MDT)" },
  { value: "America/Los_Angeles", label: "USA Pacific (PST/PDT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe Central (CET/CEST)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST/AEDT)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-31)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2025)" },
];

const CURRENCIES = [
  { value: "INR", label: "₹ Indian Rupee (INR)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "EUR", label: "€ Euro (EUR)" },
  { value: "GBP", label: "£ British Pound (GBP)" },
  { value: "AED", label: "د.إ UAE Dirham (AED)" },
  { value: "SGD", label: "S$ Singapore Dollar (SGD)" },
  { value: "AUD", label: "A$ Australian Dollar (AUD)" },
];

export default function EditStore() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: store, isLoading } = useLocationData(id || "");
  const updateStore = useUpdateLocation();
  const { data: employees } = useEmployees();

  const [formData, setFormData] = useState<CreateLocationInput>({
    name: "",
    code: "",
    type: "store",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
    address_country: "",
    phone: "",
    email: "",
    manager_id: undefined,
    opening_time: "09:00",
    closing_time: "21:00",
    is_active: true,
    timezone: "Asia/Kolkata",
    date_format: "DD/MM/YYYY",
    currency: "INR",
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        code: store.code,
        type: store.type || "store",
        address_street: store.address_street || "",
        address_city: store.address_city || "",
        address_state: store.address_state || "",
        address_zip_code: store.address_zip_code || "",
        address_country: store.address_country || "",
        phone: store.phone || "",
        email: store.email || "",
        manager_id: store.manager_id,
        opening_time: store.opening_time || "09:00",
        closing_time: store.closing_time || "21:00",
        is_active: store.is_active,
        timezone: store.timezone || "Asia/Kolkata",
        date_format: store.date_format || "DD/MM/YYYY",
        currency: store.currency || "INR",
      });
    }
  }, [store]);

  const handleChange = (field: keyof CreateLocationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updateStore.mutateAsync({ id, ...formData });
    navigate(`/admin/locations/stores/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(`/admin/locations/stores/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store Details
          </Button>
        </div>
        <PageHeader title="Edit Store" description="Loading..." />
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (!store) {
    return (
      <PageContainer>
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate("/admin/locations/stores")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stores
          </Button>
        </div>
        <PageHeader title="Store Not Found" description="The requested store could not be found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(`/admin/locations/stores/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store Details
        </Button>
      </div>

      <PageHeader title={`Edit ${store.name}`} description="Update store information" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Downtown Branch"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Store Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                  placeholder="e.g., STR-001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g., +1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="e.g., store@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Store Manager</Label>
              <Select
                value={formData.manager_id || "none"}
                onValueChange={(value) => handleChange("manager_id", value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager assigned</SelectItem>
                  {employees?.filter((e: any) => e.status === 'active' && e.id).map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_street">Street Address</Label>
              <Input
                id="address_street"
                value={formData.address_street}
                onChange={(e) => handleChange("address_street", e.target.value)}
                placeholder="e.g., 123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => handleChange("address_city", e.target.value)}
                  placeholder="e.g., New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">State</Label>
                <Input
                  id="address_state"
                  value={formData.address_state}
                  onChange={(e) => handleChange("address_state", e.target.value)}
                  placeholder="e.g., NY"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_zip_code">ZIP Code</Label>
                <Input
                  id="address_zip_code"
                  value={formData.address_zip_code}
                  onChange={(e) => handleChange("address_zip_code", e.target.value)}
                  placeholder="e.g., 10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_country">Country</Label>
                <Input
                  id="address_country"
                  value={formData.address_country}
                  onChange={(e) => handleChange("address_country", e.target.value)}
                  placeholder="e.g., USA"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleChange("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={formData.date_format}
                  onValueChange={(value) => handleChange("date_format", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((df) => (
                      <SelectItem key={df.value} value={df.value}>
                        {df.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening_time">Opening Time</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => handleChange("opening_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing_time">Closing Time</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => handleChange("closing_time", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Store is active</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/admin/locations/stores/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateStore.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateStore.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
