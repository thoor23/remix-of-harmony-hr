import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Megaphone } from "lucide-react";
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, Announcement } from "@/hooks/useAnnouncements";
import { z } from "zod";
import { format } from "date-fns";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required").max(1000),
  type: z.string().min(1, "Type is required"),
  priority: z.string().min(1, "Priority is required"),
  target_audience: z.string().min(1, "Target audience is required"),
});

type FormData = z.infer<typeof announcementSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

const typeColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  urgent: "bg-destructive text-destructive-foreground",
  event: "bg-info text-info-foreground",
  "policy-update": "bg-warning text-warning-foreground",
  holiday: "bg-primary text-primary-foreground",
};

export default function AnnouncementsManagement() {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    type: "general",
    priority: "medium",
    target_audience: "all",
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", type: "general", priority: "medium", target_audience: "all" });
    setErrors({});
    setEditingId(null);
  };

  const handleCreate = () => { resetForm(); setIsDialogOpen(true); };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const result = announcementSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => { fieldErrors[err.path[0] as keyof FormErrors] = err.message; });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (editingId) {
      updateAnnouncement.mutate({ 
        id: editingId, 
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        target_audience: formData.target_audience,
      });
    } else {
      createAnnouncement.mutate(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteClick = (announcement: Announcement) => { setAnnouncementToDelete(announcement); setDeleteDialogOpen(true); };

  const handleDeleteConfirm = () => {
    if (announcementToDelete) deleteAnnouncement.mutate(announcementToDelete.id);
    setAnnouncementToDelete(null);
    setDeleteDialogOpen(false);
  };

  const renderError = (field: keyof FormErrors) => errors[field] ? <p className="text-sm text-destructive mt-1">{errors[field]}</p> : null;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Announcements" description="Create and manage company announcements" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Announcements" description="Create and manage company announcements">
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />New Announcement</Button>
      </PageHeader>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements yet. Create your first announcement!</CardContent></Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge className={typeColors[announcement.type] || typeColors.general}>{announcement.type.replace("-", " ")}</Badge>
                        {announcement.priority === "high" && <Badge variant="destructive">High Priority</Badge>}
                      </div>
                      <p className="text-muted-foreground">{announcement.content}</p>
                      <p className="text-sm text-muted-foreground">Published on {format(new Date(announcement.published_at), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(announcement)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Announcement title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className={errors.title ? "border-destructive" : ""} />
              {renderError("title")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="policy-update">Policy Update</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea placeholder="Write your announcement..." className={`min-h-32 ${errors.content ? "border-destructive" : ""}`} value={formData.content} onChange={(e) => handleInputChange("content", e.target.value)} />
              {renderError("content")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>{editingId ? "Update" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
