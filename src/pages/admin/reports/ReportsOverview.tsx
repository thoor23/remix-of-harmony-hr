import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportCard } from "@/components/reports/ReportCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  FileText,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";

const recentActivity = [
  { id: 1, name: "Employee Report", type: "CSV", date: "2024-01-15", user: "Admin" },
  { id: 2, name: "Attendance Summary", type: "PDF", date: "2024-01-14", user: "HR Manager" },
  { id: 3, name: "Payroll Report", type: "CSV", date: "2024-01-13", user: "Admin" },
  { id: 4, name: "Leave Analysis", type: "PDF", date: "2024-01-12", user: "HR Manager" },
];

export default function ReportsOverview() {
  return (
    <PageContainer
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Scheduled Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">+12%</p>
                <p className="text-sm text-muted-foreground">Usage This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <h2 className="text-lg font-semibold mb-4">Report Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ReportCard
          title="Employee Reports"
          description="Headcount, demographics, and workforce analytics"
          icon={<Users className="h-5 w-5" />}
          href="/admin/reports/employee"
          badge="5 Reports"
        />
        <ReportCard
          title="Attendance Reports"
          description="Attendance trends, punctuality, and absenteeism"
          icon={<CalendarCheck className="h-5 w-5" />}
          href="/admin/reports/attendance"
          badge="4 Reports"
        />
        <ReportCard
          title="Leave Reports"
          description="Leave utilization, balances, and patterns"
          icon={<CalendarDays className="h-5 w-5" />}
          href="/admin/reports/leave"
          badge="4 Reports"
        />
        <ReportCard
          title="Payroll Reports"
          description="Salary analysis, disbursements, and deductions"
          icon={<Wallet className="h-5 w-5" />}
          href="/admin/reports/payroll"
          badge="4 Reports"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Export Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Exported by {activity.user}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{activity.type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {activity.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
