import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  UserPlus,
  CalendarCheck,
  FileText,
  DollarSign,
  Clock,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    icon: UserPlus,
    label: "Add Employee",
    href: "/admin/employees/add",
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20",
  },
  {
    icon: CalendarCheck,
    label: "Manage Leaves",
    href: "/admin/leaves",
    color: "text-success",
    bgColor: "bg-success/10 hover:bg-success/20",
  },
  {
    icon: Clock,
    label: "Attendance",
    href: "/admin/attendance",
    color: "text-warning",
    bgColor: "bg-warning/10 hover:bg-warning/20",
  },
  {
    icon: DollarSign,
    label: "Run Payroll",
    href: "/admin/payroll/payslips",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10 hover:bg-chart-1/20",
  },
  {
    icon: FileText,
    label: "Documents",
    href: "/admin/file-manager/employee-documents",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10 hover:bg-chart-2/20",
  },
  {
    icon: BarChart3,
    label: "Reports",
    href: "/admin/reports",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10 hover:bg-chart-4/20",
  },
];

export function QuickActionsGrid() {
  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={cn(
                "h-auto flex-col gap-2 py-4 px-3",
                action.bgColor
              )}
              asChild
            >
              <Link to={action.href}>
                <action.icon className={cn("h-6 w-6", action.color)} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
