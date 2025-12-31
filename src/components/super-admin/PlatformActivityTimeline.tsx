import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  UserPlus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "company_created" | "company_updated" | "admin_added" | "settings_changed" | "subscription_changed" | "system_alert";
  title: string;
  description: string;
  timestamp: string;
  companyName?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "company_created",
    title: "New company registered",
    description: "TechCorp Solutions joined the platform",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    companyName: "TechCorp Solutions",
  },
  {
    id: "2",
    type: "admin_added",
    title: "Super admin added",
    description: "John Doe was granted super admin access",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "subscription_changed",
    title: "Subscription upgraded",
    description: "Acme Corp upgraded to Enterprise plan",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    companyName: "Acme Corp",
  },
  {
    id: "4",
    type: "settings_changed",
    title: "Platform settings updated",
    description: "Email verification settings were modified",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "company_created":
      return { icon: Building2, color: "text-primary", bg: "bg-primary/10" };
    case "admin_added":
      return { icon: UserPlus, color: "text-success", bg: "bg-success/10" };
    case "settings_changed":
      return { icon: Settings, color: "text-warning", bg: "bg-warning/10" };
    case "subscription_changed":
      return { icon: CheckCircle, color: "text-chart-1", bg: "bg-chart-1/10" };
    case "system_alert":
      return { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" };
    default:
      return { icon: Activity, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

interface PlatformActivityTimelineProps {
  activities?: ActivityItem[];
  maxItems?: number;
}

export function PlatformActivityTimeline({ 
  activities = mockActivities, 
  maxItems = 5 
}: PlatformActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity, index) => {
              const { icon: Icon, color, bg } = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      {activity.companyName && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {activity.companyName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
