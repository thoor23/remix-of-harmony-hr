import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import {
  Building2,
  Edit,
  Power,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  website: string | null;
  domain: string | null;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  max_employees: number | null;
  created_at: string;
  updated_at: string;
  employee_count?: number;
}

export default function CompanyDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toggleCompanyStatus } = useSuperAdmin();

  const { data: company, isLoading } = useQuery({
    queryKey: ["super-admin", "company", code],
    queryFn: async () => {
      const response = await api.get<Company>(`/super-admin/companies/${code}`);
      return response;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Company Details" />
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer>
        <PageHeader title="Company Not Found" />
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Company not found</h3>
          <Link to="/super-admin/companies">
            <Button variant="link">Back to Companies</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={company.name}
        description={`Company Code: ${company.code}`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toggleCompanyStatus({
                id: company.id,
                isActive: !company.is_active,
              })
            }
          >
            <Power className="h-4 w-4 mr-2" />
            {company.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Link to={`/super-admin/companies/${company.code}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Company Information</CardTitle>
              <Badge variant={company.is_active ? "default" : "secondary"}>
                {company.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-14 h-14 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{company.name}</h3>
                <code className="bg-muted px-2 py-1 rounded text-sm">{company.code}</code>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{company.email}</p>
                </div>
              </div>

              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{company.phone}</p>
                  </div>
                </div>
              )}

              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}

              {company.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>{company.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{format(new Date(company.created_at), "MMMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p>
                    {company.employee_count || 0} / {company.max_employees || "∞"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {company.subscription_plan || "Free"}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={company.subscription_status === "active" ? "default" : "secondary"}
                className="mt-1 capitalize"
              >
                {company.subscription_status || "Active"}
              </Badge>
            </div>

            {company.subscription_expires_at && (
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="mt-1">
                  {format(new Date(company.subscription_expires_at), "MMMM d, yyyy")}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Max Employees</p>
              <p className="mt-1">{company.max_employees || "Unlimited"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/super-admin/companies/${company.code}/add-admin`)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin User
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/app/dashboard?company_id=${company.id}`)
                }
              >
                <Building2 className="h-4 w-4 mr-2" />
                View as Company
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
