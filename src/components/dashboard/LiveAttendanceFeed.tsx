import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, LogIn, LogOut, RefreshCw } from "lucide-react";
import { useLiveClockIns, ClockInItem } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";

export function LiveAttendanceFeed() {
  const { data: clockins = [], isLoading, isFetching } = useLiveClockIns(8);

  const formatTime = (time: string | null) => {
    if (!time) return "--:--";
    return time.slice(0, 5);
  };

  const getInitials = (item: ClockInItem) => {
    if (!item.employee) return "??";
    return `${item.employee.first_name?.[0] || ""}${item.employee.last_name?.[0] || ""}`;
  };

  const getName = (item: ClockInItem) => {
    if (!item.employee) return "Unknown";
    return `${item.employee.first_name || ""} ${item.employee.last_name || ""}`.trim();
  };

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Attendance
          </CardTitle>
          {isFetching && (
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : clockins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No clock-ins today yet</p>
            </div>
          ) : (
            clockins.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.employee?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(item)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{getName(item)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.employee?.employee_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.check_in && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <LogIn className="h-3 w-3 text-success" />
                      {formatTime(item.check_in)}
                    </Badge>
                  )}
                  {item.check_out && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <LogOut className="h-3 w-3 text-destructive" />
                      {formatTime(item.check_out)}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
