import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Activity,
  UserPlus,
  CalendarCheck,
  FileText,
  Bell,
  Settings,
  Clock,
  ArrowRight,
  User,
  Briefcase,
} from "lucide-react";
import { useRecentActivity, ActivityItem } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getModuleIcon = (module: string) => {
  switch (module.toLowerCase()) {
    case 'employees':
      return UserPlus;
    case 'leaves':
      return CalendarCheck;
    case 'attendance':
      return Clock;
    case 'documents':
      return FileText;
    case 'notifications':
      return Bell;
    case 'settings':
      return Settings;
    case 'payroll':
      return Briefcase;
    default:
      return Activity;
  }
};

const getActionColor = (action: string) => {
  if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
    return 'text-success';
  }
  if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
    return 'text-warning';
  }
  if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
    return 'text-destructive';
  }
  return 'text-primary';
};

export function ActivityTimeline() {
  const { data: activities = [], isLoading } = useRecentActivity(8);

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/audit-logs">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity, index) => {
                const Icon = getModuleIcon(activity.module);
                const actionColor = getActionColor(activity.action);
                
                return (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 bg-background border-2 border-border",
                      actionColor.replace('text-', 'border-')
                    )}>
                      <Icon className={cn("h-4 w-4", actionColor)} />
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <p className="text-sm">
                        <span className="font-medium">{activity.performer_name || 'System'}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
