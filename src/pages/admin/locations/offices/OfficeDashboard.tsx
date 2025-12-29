import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { Building2, Users, UserCheck } from "lucide-react";
import { useOffices } from "@/hooks/useLocations";

export default function OfficeDashboard() {
  const { data: offices = [], isLoading } = useOffices();
  const activeOffices = offices.filter(o => o.is_active);
  const totalEmployees = offices.reduce((sum, o) => sum + (o.employee_count || 0), 0);

  return (
    <PageContainer>
      <PageHeader title="Office Dashboard" description="Overview of your office locations" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
        <EnhancedStatCard title="Total Offices" value={offices.length} subtitle="All offices" icon={Building2} variant="primary" />
        <EnhancedStatCard title="Active Offices" value={activeOffices.length} subtitle="Currently active" icon={UserCheck} variant="success" />
        <EnhancedStatCard title="Total Employees" value={totalEmployees} subtitle="Across all offices" icon={Users} />
      </div>
      <Card>
        <CardHeader><CardTitle>Offices Overview</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : offices.length === 0 ? <p className="text-muted-foreground">No offices found</p> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offices.map(office => (
                <Card key={office.id} className="p-4">
                  <h3 className="font-semibold">{office.name}</h3>
                  <p className="text-sm text-muted-foreground">{office.code}</p>
                  <p className="text-sm">{office.address_city || "No location"}</p>
                  <p className="text-xs text-muted-foreground mt-2">{office.employee_count || 0} employees</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
