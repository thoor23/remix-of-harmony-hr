import { useState, useMemo } from "react";
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Calendar,
  HelpCircle,
  Settings,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Inbox,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/hooks/useNotifications";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
        badge: "bg-green-500/10 text-green-600 border-green-500/20",
      };
    case "warning":
      return {
        bg: "bg-yellow-500/10",
        icon: "text-yellow-500",
        border: "border-yellow-500/20",
        badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      };
    case "error":
      return {
        bg: "bg-red-500/10",
        icon: "text-red-500",
        border: "border-red-500/20",
        badge: "bg-red-500/10 text-red-600 border-red-500/20",
      };
    default:
      return {
        bg: "bg-blue-500/10",
        icon: "text-blue-500",
        border: "border-blue-500/20",
        badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const NotificationSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No notifications</h3>
      <p className="text-sm text-muted-foreground mt-1">
        You're all caught up! No notifications to display.
      </p>
    </CardContent>
  </Card>
);

const NotificationsPage = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType =
        filterType === "all" || notification.type === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "unread" && !notification.is_read) ||
        (filterStatus === "read" && notification.is_read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchQuery, filterType, filterStatus]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleMarkSelectedRead = () => {
    selectedIds.forEach((id) => {
      markRead.mutate(id);
    });
    setSelectedIds([]);
    toast.success(`Marked ${selectedIds.length} notification(s) as read`);
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => {
      deleteNotification.mutate(id);
    });
    setSelectedIds([]);
    toast.success(`Deleted ${selectedIds.length} notification(s)`);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
    toast.success("All notifications marked as read");
  };

  const handleDeleteAll = () => {
    deleteAllNotifications.mutate();
    toast.success("All notifications deleted");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="View and manage all your notifications"
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">
                {notifications.length - unreadCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={notifications.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {notifications.length}{" "}
                      notification(s). This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkSelectedRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Read
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedIds.length}{" "}
                      notification(s). This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Select All */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={
              selectedIds.length === filteredNotifications.length &&
              filteredNotifications.length > 0
            }
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all ({filteredNotifications.length})
          </span>
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.title, notification.type);
            const styles = getTypeStyles(notification.type);
            const isSelected = selectedIds.includes(notification.id);

            return (
              <Card
                key={notification.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md cursor-pointer",
                  !notification.is_read && "border-l-4 border-l-primary bg-accent/30",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Icon */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border",
                        styles.bg,
                        styles.border
                      )}
                    >
                      <Icon className={cn("h-5 w-5", styles.icon)} />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "text-sm",
                                !notification.is_read
                                  ? "font-semibold"
                                  : "font-medium"
                              )}
                            >
                              {notification.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn("text-xs capitalize", styles.badge)}
                            >
                              {notification.type}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markRead.mutate(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete notification?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this notification.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteNotification.mutate(notification.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default NotificationsPage;
