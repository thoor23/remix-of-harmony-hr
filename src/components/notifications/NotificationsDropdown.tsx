import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  HelpCircle,
  Settings,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

const getNotificationIcon = (title: string, type: string) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes("leave")) {
    return Calendar;
  }
  if (titleLower.includes("helpdesk") || titleLower.includes("ticket")) {
    return HelpCircle;
  }
  if (titleLower.includes("system") || titleLower.includes("settings")) {
    return Settings;
  }
  
  switch (type) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return AlertCircle;
    default:
      return Info;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case "success":
      return {
        bg: "bg-green-500/10",
        icon: "text-green-500",
        border: "border-green-500/20",
      };
    case "warning":
      return {
        bg: "bg-yellow-500/10",
        icon: "text-yellow-500",
        border: "border-yellow-500/20",
      };
    case "error":
      return {
        bg: "bg-red-500/10",
        icon: "text-red-500",
        border: "border-red-500/20",
      };
    default:
      return {
        bg: "bg-blue-500/10",
        icon: "text-blue-500",
        border: "border-blue-500/20",
      };
  }
};

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { label: string; notifications: Notification[] }[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    if (isToday(date)) {
      today.push(notification);
    } else if (isYesterday(date)) {
      yesterday.push(notification);
    } else {
      earlier.push(notification);
    }
  });

  if (today.length > 0) {
    groups.push({ label: "Today", notifications: today });
  }
  if (yesterday.length > 0) {
    groups.push({ label: "Yesterday", notifications: yesterday });
  }
  if (earlier.length > 0) {
    groups.push({ label: "Earlier", notifications: earlier });
  }

  return groups;
};

const NotificationSkeleton = () => (
  <div className="p-3 space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ isUnread = false }: { isUnread?: boolean }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
      <Inbox className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">
      {isUnread ? "All caught up!" : "No notifications yet"}
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      {isUnread
        ? "You've read all your notifications"
        : "We'll notify you when something arrives"}
    </p>
  </div>
);

const NotificationItem = ({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = getNotificationIcon(notification.title, notification.type);
  const styles = getTypeStyles(notification.type);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-3 cursor-pointer transition-all duration-200",
        "hover:bg-accent/50 group",
        !notification.is_read && "bg-accent/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(notification)}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border",
          styles.bg,
          styles.border
        )}
      >
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <p
          className={cn(
            "text-sm leading-tight",
            !notification.is_read ? "font-semibold" : "font-medium"
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Mark as read button */}
      {!notification.is_read && isHovered && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export const NotificationsDropdown = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const displayNotifications =
    activeTab === "unread" ? unreadNotifications : notifications;
  const groupedNotifications = groupNotificationsByDate(displayNotifications);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs",
                "animate-in zoom-in-50 duration-200"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {notifications.length}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-2">
            <TabsList className="h-9 w-full bg-transparent p-0 gap-4">
              <TabsTrigger
                value="all"
                className="relative h-9 px-2 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="relative h-9 px-2 pb-2.5 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium"
              >
                Unread
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 px-1 text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[340px]">
              {isLoading ? (
                <NotificationSkeleton />
              ) : groupedNotifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="divide-y">
                  {groupedNotifications.map((group) => (
                    <div key={group.label}>
                      <div className="px-4 py-2 bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground">
                          {group.label}
                        </p>
                      </div>
                      {group.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[340px]">
              {isLoading ? (
                <NotificationSkeleton />
              ) : unreadNotifications.length === 0 ? (
                <EmptyState isUnread />
              ) : (
                <div className="divide-y">
                  {groupNotificationsByDate(unreadNotifications).map((group) => (
                    <div key={group.label}>
                      <div className="px-4 py-2 bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground">
                          {group.label}
                        </p>
                      </div>
                      {group.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2 bg-muted/30">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/admin/notifications")}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
