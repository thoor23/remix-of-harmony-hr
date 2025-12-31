import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Building2, Loader2 } from "lucide-react";

export default function AddCompany() {
  const navigate = useNavigate();
  const { createCompany, isCreating } = useSuperAdmin();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    domain: "",
    max_employees: 50,
    subscription_plan: "free",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompany(formData, {
      onSuccess: () => {
        navigate("/super-admin/companies");
      },
    });
  };

  return (
    <PageContainer
      title="Add Company"
      description="Create a new company on the platform"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Company Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="ACME"
                  required
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier (max 10 characters)
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@acme.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, Country"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="acme.hrms.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max_employees">Max Employees</Label>
                <Input
                  id="max_employees"
                  type="number"
                  value={formData.max_employees}
                  onChange={(e) =>
                    setFormData({ ...formData, max_employees: parseInt(e.target.value) || 50 })
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select
                  value={formData.subscription_plan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subscription_plan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/super-admin/companies")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Company
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
