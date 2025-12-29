import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Cake, PartyPopper } from "lucide-react";
import { useUpcomingEvents, UpcomingEvent } from "@/hooks/useDashboard";
import { format, isToday, isTomorrow } from "date-fns";

export function UpcomingEventsCard() {
  const { data: events = [], isLoading } = useUpcomingEvents();

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getEventIcon = (event: UpcomingEvent) => {
    if (event.type === "birthday") return Cake;
    return PartyPopper;
  };

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming events this week</p>
            </div>
          ) : (
            events.slice(0, 6).map((event, index) => {
              const Icon = getEventIcon(event);
              return (
                <div
                  key={`${event.type}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {event.type === "birthday" ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={event.avatar_url} />
                      <AvatarFallback className="text-xs bg-pink-500/10 text-pink-500">
                        <Cake className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.type === "birthday" ? "Birthday" : "Holiday"}
                    </p>
                  </div>
                  <Badge 
                    variant={isToday(new Date(event.date)) ? "default" : "outline"} 
                    className="text-xs shrink-0"
                  >
                    {formatEventDate(event.date)}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
