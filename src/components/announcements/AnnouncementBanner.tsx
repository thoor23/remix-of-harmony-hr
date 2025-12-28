import { useState, useEffect, useCallback } from "react";
import { X, Megaphone, Calendar, Shield, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  type?: string;
  published_at: string;
  expires_at?: string | null;
}

interface AnnouncementBannerProps {
  announcements: Announcement[];
  isLoading?: boolean;
}

const getTypeIcon = (type?: string) => {
  switch (type) {
    case "event":
      return Calendar;
    case "policy":
      return Shield;
    case "urgent":
      return AlertTriangle;
    default:
      return Megaphone;
  }
};

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20 dark:border-destructive/40";
    case "medium":
      return "bg-warning/10 border-warning/30 text-warning-foreground dark:bg-warning/20 dark:border-warning/40";
    default:
      return "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40";
  }
};

const getTimeRemaining = (expiresAt: string): string | null => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export function AnnouncementBanner({ announcements, isLoading }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [expiredIds, setExpiredIds] = useState<string[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("dismissed-announcements");
    if (stored) {
      try {
        setDismissedIds(JSON.parse(stored));
      } catch {
        setDismissedIds([]);
      }
    }
  }, []);

  // Check for expired announcements and update countdown every minute
  const checkExpiredAnnouncements = useCallback(() => {
    const now = new Date();
    const newExpiredIds: string[] = [];
    
    announcements.forEach((a) => {
      if (a.expires_at) {
        const expiryDate = new Date(a.expires_at);
        if (expiryDate <= now) {
          newExpiredIds.push(a.id);
        }
      }
    });
    
    if (newExpiredIds.length > 0) {
      setExpiredIds((prev) => [...new Set([...prev, ...newExpiredIds])]);
    }
  }, [announcements]);

  useEffect(() => {
    checkExpiredAnnouncements();
    
    // Update every 30 seconds to refresh countdown timers
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      checkExpiredAnnouncements();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkExpiredAnnouncements]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed-announcements", JSON.stringify(newDismissed));
  };

  if (isLoading) return null;

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id) && !expiredIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const Icon = getTypeIcon(announcement.type);
        const timeRemaining = announcement.expires_at ? getTimeRemaining(announcement.expires_at) : null;
        
        return (
          <div
            key={announcement.id}
            className={cn(
              "flex items-start justify-between gap-4 p-4 rounded-lg border transition-all",
              getPriorityStyles(announcement.priority)
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{announcement.title}</p>
                  {timeRemaining && (
                    <span className="flex items-center gap-1 text-xs opacity-70 bg-background/30 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      {timeRemaining}
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-80 line-clamp-2 mt-0.5">
                  {announcement.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 hover:bg-background/50"
              onClick={() => handleDismiss(announcement.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
