import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useDefaultBannerTemplate } from "@/hooks/useBannerTemplates";

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

const getTypeIcon = (type?: string): string => {
  switch (type) {
    case "event":
      return "📅";
    case "policy":
      return "🛡️";
    case "urgent":
      return "⚠️";
    default:
      return "📢";
  }
};

const getPriorityColors = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        color: "#DC2626",
        bg: "rgba(220, 38, 38, 0.1)",
        border: "rgba(220, 38, 38, 0.3)",
      };
    case "medium":
      return {
        color: "#CA8A04",
        bg: "rgba(202, 138, 4, 0.1)",
        border: "rgba(202, 138, 4, 0.3)",
      };
    default:
      return {
        color: "#2563EB",
        bg: "rgba(37, 99, 235, 0.1)",
        border: "rgba(37, 99, 235, 0.3)",
      };
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
  
  const { data: defaultTemplate } = useDefaultBannerTemplate();

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

  const visibleAnnouncements = useMemo(() => 
    announcements.filter(
      (a) => !dismissedIds.includes(a.id) && !expiredIds.includes(a.id)
    ), [announcements, dismissedIds, expiredIds]
  );

  // Generate HTML from template with placeholders replaced
  const renderBannerHtml = useCallback((announcement: Announcement) => {
    if (!defaultTemplate?.html_content) return null;

    const priorityColors = getPriorityColors(announcement.priority);
    const timeRemaining = announcement.expires_at ? getTimeRemaining(announcement.expires_at) : "";

    const placeholders: Record<string, string> = {
      "{{title}}": announcement.title,
      "{{content}}": announcement.content,
      "{{priority}}": announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1),
      "{{type}}": (announcement.type || "general").charAt(0).toUpperCase() + (announcement.type || "general").slice(1),
      "{{type_icon}}": getTypeIcon(announcement.type),
      "{{time_remaining}}": timeRemaining || "",
      "{{expires_at}}": announcement.expires_at ? format(new Date(announcement.expires_at), "MMM dd, yyyy") : "",
      "{{published_at}}": format(new Date(announcement.published_at), "MMM dd, yyyy"),
      "{{priority_color}}": priorityColors.color,
      "{{priority_bg}}": priorityColors.bg,
      "{{priority_border}}": priorityColors.border,
    };

    let html = defaultTemplate.html_content;
    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    return html;
  }, [defaultTemplate]);

  if (isLoading) return null;
  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const bannerHtml = renderBannerHtml(announcement);

        // Use HTML template if available
        if (bannerHtml) {
          return (
            <div key={announcement.id} className="relative group">
              <div dangerouslySetInnerHTML={{ __html: bannerHtml }} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }

        // Fallback to hardcoded design if no template
        const priorityColors = getPriorityColors(announcement.priority);
        const timeRemaining = announcement.expires_at ? getTimeRemaining(announcement.expires_at) : null;

        return (
          <div
            key={announcement.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg border transition-all"
            style={{
              backgroundColor: priorityColors.bg,
              borderColor: priorityColors.border,
              color: priorityColors.color,
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-xl">{getTypeIcon(announcement.type)}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{announcement.title}</p>
                  {timeRemaining && (
                    <span className="flex items-center gap-1 text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded-full">
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
              className="shrink-0 h-8 w-8 hover:bg-white/20"
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
