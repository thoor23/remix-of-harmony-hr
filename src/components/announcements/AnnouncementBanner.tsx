import { useState, useEffect } from "react";
import { X, Megaphone, Calendar, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  type?: string;
  published_at: string;
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

export function AnnouncementBanner({ announcements, isLoading }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

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

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed-announcements", JSON.stringify(newDismissed));
  };

  if (isLoading) return null;

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const Icon = getTypeIcon(announcement.type);
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
                <p className="font-semibold text-sm">{announcement.title}</p>
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
