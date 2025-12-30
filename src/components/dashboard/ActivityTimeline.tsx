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
    <Card className="dark:border-border/50 h-[320px] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to="/app/audit-logs">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0">
        <div className="relative h-full overflow-y-auto pr-2">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = getModuleIcon(activity.module);
                const actionColor = getActionColor(activity.action);
                
                return (
                  <div key={activity.id} className="flex gap-3 relative">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-background border border-border",
                      actionColor.replace('text-', 'border-')
                    )}>
                      <Icon className={cn("h-3 w-3", actionColor)} />
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-xs leading-tight">
                        <span className="font-medium">{activity.performer_name || 'System'}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
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
