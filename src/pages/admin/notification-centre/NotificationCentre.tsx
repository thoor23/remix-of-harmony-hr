import { useState, useMemo } from "react";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { 
  Bell, 
  Megaphone, 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  Users, 
  Building2,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Search,
  CalendarIcon,
  Clock,
  FileText,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { useTargetedNotifications, useSendTargetedNotification, useDeleteTargetedNotification } from "@/hooks/useTargetedNotifications";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { 
  useAnnouncementTemplates, 
  useDeleteAnnouncementTemplate,
  AnnouncementTemplate 
} from "@/hooks/useAnnouncementTemplates";
import { useBannerTemplates, DEFAULT_BANNER_HTML } from "@/hooks/useBannerTemplates";

const typeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  policy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success': return <CheckCircle className="h-4 w-4" />;
    case 'warning': return <AlertTriangle className="h-4 w-4" />;
    case 'error': return <AlertCircle className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

// Helper function for banner preview
const getBannerTypeIcon = (type: string): string => {
  switch (type) {
    case "event": return "📅";
    case "policy": return "🛡️";
    case "urgent": return "⚠️";
    default: return "📢";
  }
};

const getPriorityColorsForBanner = (priority: string) => {
  switch (priority) {
    case "high":
      return { color: "#DC2626", bg: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.3)" };
    case "medium":
      return { color: "#CA8A04", bg: "rgba(202, 138, 4, 0.1)", border: "rgba(202, 138, 4, 0.3)" };
    default:
      return { color: "#2563EB", bg: "rgba(37, 99, 235, 0.1)", border: "rgba(37, 99, 235, 0.3)" };
  }
};

interface BannerPreviewProps {
  templateId: string;
  bannerTemplates: Array<{
    id: string;
    name: string;
    html_content: string;
  }>;
  title: string;
  content: string;
  priority: string;
  type: string;
}

function BannerPreview({ templateId, bannerTemplates, title, content, priority, type }: BannerPreviewProps) {
  const template = bannerTemplates.find(t => t.id === templateId);
  
  if (!template?.html_content) {
    return null;
  }

  const priorityColors = getPriorityColorsForBanner(priority);

  const placeholders: Record<string, string> = {
    "{{title}}": title,
    "{{content}}": content,
    "{{priority}}": priority.charAt(0).toUpperCase() + priority.slice(1),
    "{{type}}": type.charAt(0).toUpperCase() + type.slice(1),
    "{{type_icon}}": getBannerTypeIcon(type),
    "{{time_remaining}}": "",
    "{{expires_at}}": "",
    "{{published_at}}": "Now",
    "{{priority_color}}": priorityColors.color,
    "{{priority_bg}}": priorityColors.bg,
    "{{priority_border}}": priorityColors.border,
  };

  let html = template.html_content;
  Object.entries(placeholders).forEach(([key, value]) => {
    html = html.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });

  return (
    <div className="mt-2 p-2 rounded border bg-muted/50">
      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
      <div 
        className="transform scale-90 origin-top-left"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
}

export default function NotificationCentre() {
  // Announcement state
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "general",
    priority: "medium",
    target_audience: "all",
    scheduled_at: null as Date | null,
    expires_at: null as Date | null,
    banner_template_id: null as string | null,
  });

  // Template state
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Targeted notification state
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deleteNotificationId, setDeleteNotificationId] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    target_type: "all" as 'all' | 'department' | 'employees',
    target_ids: [] as string[],
  });
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Hooks
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const { data: templates } = useAnnouncementTemplates();
  const deleteTemplate = useDeleteAnnouncementTemplate();
  
  const { data: bannerTemplates } = useBannerTemplates();

  const { data: targetedNotifications, isLoading: notificationsLoading } = useTargetedNotifications();
  const sendNotification = useSendTargetedNotification();
  const deleteTargetedNotification = useDeleteTargetedNotification();

  const { data: departments } = useDepartmentsData();
  const { data: employees } = useEmployees();

  const filteredEmployees = employees?.filter(emp => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    return fullName.includes(employeeSearch.toLowerCase()) || emp.employee_id.toLowerCase().includes(employeeSearch.toLowerCase());
  });

  // Announcement handlers
  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: "",
      content: "",
      type: "general",
      priority: "medium",
      target_audience: "all",
      scheduled_at: null,
      expires_at: null,
      banner_template_id: null,
    });
    setAnnouncementDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement.id);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      scheduled_at: announcement.scheduled_at ? new Date(announcement.scheduled_at) : null,
      expires_at: announcement.expires_at ? new Date(announcement.expires_at) : null,
      banner_template_id: announcement.banner_template_id || null,
    });
    setAnnouncementDialogOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    const formData = {
      title: announcementForm.title,
      content: announcementForm.content,
      type: announcementForm.type,
      priority: announcementForm.priority,
      target_audience: announcementForm.target_audience,
      scheduled_at: announcementForm.scheduled_at?.toISOString() || null,
      expires_at: announcementForm.expires_at?.toISOString() || null,
      banner_template_id: announcementForm.banner_template_id,
    };
    
    if (editingAnnouncement) {
      await updateAnnouncement.mutateAsync({
        id: editingAnnouncement,
        ...formData,
      });
    } else {
      await createAnnouncement.mutateAsync(formData);
    }
    setAnnouncementDialogOpen(false);
  };
  
  const getAnnouncementStatus = (announcement: any) => {
    const now = new Date();
    if (announcement.scheduled_at && new Date(announcement.scheduled_at) > now) {
      return { label: "Scheduled", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" };
    }
    if (announcement.expires_at && new Date(announcement.expires_at) <= now) {
      return { label: "Expired", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" };
    }
    return { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
  };

  const handleDeleteAnnouncement = async () => {
    if (deleteAnnouncementId) {
      await deleteAnnouncement.mutateAsync(deleteAnnouncementId);
      setDeleteAnnouncementId(null);
    }
  };

  // Template handlers
  const handleLoadTemplate = (template: AnnouncementTemplate) => {
    setAnnouncementForm({
      title: template.title,
      content: template.content,
      type: template.type,
      priority: template.priority,
      target_audience: template.target_audience,
      scheduled_at: null,
      expires_at: null,
      banner_template_id: announcementForm.banner_template_id,
    });
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplateId) {
      await deleteTemplate.mutateAsync(deleteTemplateId);
      setDeleteTemplateId(null);
    }
  };

  // Notification handlers
  const handleCreateNotification = () => {
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      priority: "medium",
      target_type: "all",
      target_ids: [],
    });
    setNotificationDialogOpen(true);
  };

  const handleSendNotification = async () => {
    await sendNotification.mutateAsync(notificationForm);
    setNotificationDialogOpen(false);
  };

  const handleDeleteNotification = async () => {
    if (deleteNotificationId) {
      await deleteTargetedNotification.mutateAsync(deleteNotificationId);
      setDeleteNotificationId(null);
    }
  };

  const toggleTargetId = (id: string) => {
    setNotificationForm(prev => ({
      ...prev,
      target_ids: prev.target_ids.includes(id)
        ? prev.target_ids.filter(i => i !== id)
        : [...prev.target_ids, id],
    }));
  };

  const getTargetLabel = (notification: any) => {
    if (notification.target_type === 'all') return 'All Employees';
    if (notification.target_type === 'department') {
      const count = notification.target_ids?.length || 0;
      return `${count} Department${count !== 1 ? 's' : ''}`;
    }
    if (notification.target_type === 'employees') {
      const count = notification.target_ids?.length || 0;
      return `${count} Employee${count !== 1 ? 's' : ''}`;
    }
    return 'Unknown';
  };

  return (
    <PageContainer>
      <PageHeader title="Notification Centre" description="Manage announcements and send targeted notifications" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements Column */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>Company-wide announcements</CardDescription>
              </div>
            </div>
            <Button onClick={handleCreateAnnouncement} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[500px] pr-4">
              {announcementsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : announcements?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements?.map(announcement => {
                    const status = getAnnouncementStatus(announcement);
                    return (
                      <div
                        key={announcement.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{announcement.title}</h4>
                              <Badge variant="secondary" className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {announcement.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary" className={typeColors[announcement.type]}>
                                {announcement.type}
                              </Badge>
                              <Badge variant="secondary" className={priorityColors[announcement.priority]}>
                                {announcement.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(announcement.published_at), "MMM d, yyyy")}
                              </span>
                              {announcement.scheduled_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Starts: {format(new Date(announcement.scheduled_at), "MMM d, h:mm a")}
                                </span>
                              )}
                              {announcement.expires_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires: {format(new Date(announcement.expires_at), "MMM d, h:mm a")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditAnnouncement(announcement)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteAnnouncementId(announcement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Targeted Notifications Column */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Targeted Notifications</CardTitle>
                <CardDescription>Send to specific departments or employees</CardDescription>
              </div>
            </div>
            <Button onClick={handleCreateNotification} size="sm">
              <Send className="h-4 w-4 mr-1" />
              Send New
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[500px] pr-4">
              {notificationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : targetedNotifications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {targetedNotifications?.map(notification => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            <h4 className="font-medium truncate">{notification.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className={typeColors[notification.type]}>
                              {notification.type}
                            </Badge>
                            <Badge variant="outline">
                              {notification.target_type === 'department' ? (
                                <Building2 className="h-3 w-3 mr-1" />
                              ) : (
                                <Users className="h-3 w-3 mr-1" />
                              )}
                              {getTargetLabel(notification)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.sent_at), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteNotificationId(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      {templates && templates.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Saved Templates</CardTitle>
                <CardDescription>Manage your announcement templates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {template.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={typeColors[template.type]}>
                          {template.type}
                        </Badge>
                        <Badge variant="secondary" className={priorityColors[template.priority]}>
                          {template.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteTemplateId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? "Update the announcement details" : "Create a company-wide announcement"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Template selector */}
            {!editingAnnouncement && templates && templates.length > 0 && (
              <div className="space-y-2">
                <Label>Load from Template</Label>
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) handleLoadTemplate(template);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="Announcement content"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={announcementForm.type}
                  onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={announcementForm.priority}
                  onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={announcementForm.target_audience}
                onValueChange={(value) => setAnnouncementForm({ ...announcementForm, target_audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="managers">Managers Only</SelectItem>
                  <SelectItem value="hr">HR Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Banner Template Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Banner Template
              </Label>
              <Select
                value={announcementForm.banner_template_id || "default"}
                onValueChange={(value) => setAnnouncementForm({ 
                  ...announcementForm, 
                  banner_template_id: value === "default" ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use default template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use Default Template</SelectItem>
                  {bannerTemplates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {announcementForm.banner_template_id && bannerTemplates && (
                <BannerPreview 
                  templateId={announcementForm.banner_template_id} 
                  bannerTemplates={bannerTemplates}
                  title={announcementForm.title || "Sample Title"}
                  content={announcementForm.content || "Sample content..."}
                  priority={announcementForm.priority}
                  type={announcementForm.type}
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Start (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !announcementForm.scheduled_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {announcementForm.scheduled_at 
                        ? format(announcementForm.scheduled_at, "PPP p") 
                        : "Immediate"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={announcementForm.scheduled_at || undefined}
                      onSelect={(date) => setAnnouncementForm({ ...announcementForm, scheduled_at: date || null })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                    <div className="p-3 border-t">
                      <TimePicker
                        value={announcementForm.scheduled_at ? format(announcementForm.scheduled_at, "HH:mm") : ""}
                        onChange={(time) => {
                          if (time) {
                            const [hours, minutes] = time.split(":");
                            const newDate = announcementForm.scheduled_at 
                              ? new Date(announcementForm.scheduled_at) 
                              : new Date();
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setAnnouncementForm({ ...announcementForm, scheduled_at: newDate });
                          }
                        }}
                        placeholder="Select time"
                      />
                      {announcementForm.scheduled_at && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => setAnnouncementForm({ ...announcementForm, scheduled_at: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !announcementForm.expires_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {announcementForm.expires_at 
                        ? format(announcementForm.expires_at, "PPP p") 
                        : "Never"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={announcementForm.expires_at || undefined}
                      onSelect={(date) => setAnnouncementForm({ ...announcementForm, expires_at: date || null })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                    <div className="p-3 border-t">
                      <TimePicker
                        value={announcementForm.expires_at ? format(announcementForm.expires_at, "HH:mm") : ""}
                        onChange={(time) => {
                          if (time) {
                            const [hours, minutes] = time.split(":");
                            const newDate = announcementForm.expires_at 
                              ? new Date(announcementForm.expires_at) 
                              : new Date();
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setAnnouncementForm({ ...announcementForm, expires_at: newDate });
                          }
                        }}
                        placeholder="Select time"
                      />
                      {announcementForm.expires_at && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => setAnnouncementForm({ ...announcementForm, expires_at: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAnnouncement} 
              disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
            >
              {editingAnnouncement ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Targeted Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Targeted Notification</DialogTitle>
            <DialogDescription>
              Send notifications to specific departments or employees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={notificationForm.priority}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Send To</Label>
              <Select
                value={notificationForm.target_type}
                onValueChange={(value: 'all' | 'department' | 'employees') => 
                  setNotificationForm({ ...notificationForm, target_type: value, target_ids: [] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="department">Specific Departments</SelectItem>
                  <SelectItem value="employees">Specific Employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {notificationForm.target_type === 'department' && (
              <div className="space-y-2">
                <Label>Select Departments</Label>
                <ScrollArea className="h-[150px] border rounded-md p-3">
                  <div className="space-y-2">
                    {departments?.map(dept => (
                      <div key={dept.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={notificationForm.target_ids.includes(dept.id)}
                          onCheckedChange={() => toggleTargetId(dept.id)}
                        />
                        <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {notificationForm.target_ids.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {notificationForm.target_ids.length} department(s) selected
                  </p>
                )}
              </div>
            )}

            {notificationForm.target_type === 'employees' && (
              <div className="space-y-2">
                <Label>Select Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[150px] border rounded-md p-3">
                  <div className="space-y-2">
                    {filteredEmployees?.map(emp => {
                      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_id;
                      return (
                        <div key={emp.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`emp-${emp.id}`}
                            checked={notificationForm.target_ids.includes(emp.id)}
                            onCheckedChange={() => toggleTargetId(emp.id)}
                          />
                          <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">
                            {fullName} <span className="text-muted-foreground">({emp.employee_id})</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {notificationForm.target_ids.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {notificationForm.target_ids.length} employee(s) selected
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={sendNotification.isPending || !notificationForm.title || !notificationForm.message}
            >
              <Send className="h-4 w-4 mr-1" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Confirmation */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={() => setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnnouncement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Notification Confirmation */}
      <AlertDialog open={!!deleteNotificationId} onOpenChange={() => setDeleteNotificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification from history? This won't affect notifications already sent to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
