import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
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
import { useStore, useUpdateStore, CreateStoreInput } from "@/hooks/useStores";
import { useEmployees } from "@/hooks/useEmployees";
import { ArrowLeft, Save } from "lucide-react";

export default function EditStore() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: store, isLoading } = useStore(id || "");
  const updateStore = useUpdateStore();
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

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        code: store.code,
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
      });
    }
  }, [store]);

  const handleChange = (field: keyof CreateStoreInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updateStore.mutateAsync({ id, ...formData });
    navigate(`/admin/stores/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer title="Edit Store" subtitle="Loading...">
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
      <PageContainer title="Store Not Found" subtitle="The requested store could not be found">
        <Button asChild>
          <Link to="/admin/stores">Back to Stores</Link>
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit ${store.name}`}
      subtitle="Update store information"
      actions={
        <Button variant="outline" onClick={() => navigate(`/admin/stores/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Store
        </Button>
      }
    >
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
                value={formData.manager_id || ""}
                onValueChange={(value) => handleChange("manager_id", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No manager assigned</SelectItem>
                  {employees?.filter((e: any) => e.status === 'active').map((emp: any) => (
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
          <Button type="button" variant="outline" onClick={() => navigate(`/admin/stores/${id}`)}>
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
