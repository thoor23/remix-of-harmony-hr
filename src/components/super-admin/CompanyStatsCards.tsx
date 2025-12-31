import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Users, Clock, Calendar, Ticket, FileText, Package } from "lucide-react";

interface CompanyStats {
  employee_count: number;
  active_employees: number;
  today_attendance: number;
  pending_leaves: number;
  open_tickets: number;
  total_assets: number;
}

interface CompanyStatsCardsProps {
  companyId: string;
}

export function CompanyStatsCards({ companyId }: CompanyStatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["super-admin", "company-stats", companyId],
    queryFn: async () => {
      const response = await api.get<CompanyStats>(
        `/super-admin/companies/${companyId}/stats`
      );
      return response;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Employees",
      value: stats?.employee_count || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active",
      value: stats?.active_employees || 0,
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Today's Attendance",
      value: stats?.today_attendance || 0,
      icon: Clock,
      color: "text-primary",
    },
    {
      label: "Pending Leaves",
      value: stats?.pending_leaves || 0,
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      label: "Open Tickets",
      value: stats?.open_tickets || 0,
      icon: Ticket,
      color: "text-purple-500",
    },
    {
      label: "Total Assets",
      value: stats?.total_assets || 0,
      icon: Package,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
