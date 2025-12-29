import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStore, CreateStoreInput } from "@/hooks/useStores";
import { useEmployees } from "@/hooks/useEmployees";
import { ArrowLeft, Save } from "lucide-react";

export default function AddStore() {
  const navigate = useNavigate();
  const createStore = useCreateStore();
  const { data: employees } = useEmployees();

  const [formData, setFormData] = useState<CreateStoreInput>({
    name: "",
    code: "",
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
  });

  const handleChange = (field: keyof CreateStoreInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStore.mutateAsync(formData);
    navigate("/admin/stores");
  };

  // Generate store code from name
  const generateCode = () => {
    if (formData.name) {
      const code = "STR-" + formData.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 5)
        .padEnd(3, "0");
      handleChange("code", code);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Add Store" description="Create a new store location">
        <Button variant="outline" onClick={() => navigate("/admin/stores")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stores
        </Button>
      </PageHeader>
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
                  onBlur={generateCode}
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
                  {employees?.filter(e => e.status === 'active' && e.id).map((emp: any) => (
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
          <Button type="button" variant="outline" onClick={() => navigate("/admin/stores")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createStore.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createStore.isPending ? "Creating..." : "Create Store"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
