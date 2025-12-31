import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  LayoutTemplate, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  useOnboardingTemplates, 
  useCreateOnboardingTemplate,
  useUpdateOnboardingTemplate,
  useDeleteOnboardingTemplate,
  OnboardingTaskTemplate 
} from "@/hooks/useOnboarding";

const categoryLabels: Record<string, string> = {
  pre_joining: "Pre-Joining",
  day_one: "Day One",
  week_one: "First Week",
  month_one: "First Month",
};

const defaultTasks: OnboardingTaskTemplate[] = [
  { title: "Collect ID proof and address proof", category: "pre_joining", order: 1 },
  { title: "Verify educational certificates", category: "pre_joining", order: 2 },
  { title: "Complete background verification", category: "pre_joining", order: 3 },
  { title: "Create employee ID and email", category: "day_one", order: 1 },
  { title: "Issue laptop/desktop", category: "day_one", order: 2 },
  { title: "HR orientation session", category: "day_one", order: 3 },
  { title: "Team introduction", category: "day_one", order: 4 },
  { title: "Assign buddy/mentor", category: "week_one", order: 1 },
  { title: "Complete compliance training", category: "week_one", order: 2 },
  { title: "Set initial goals and KPIs", category: "month_one", order: 1 },
  { title: "First performance check-in", category: "month_one", order: 2 },
];

export default function OnboardingTemplates() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [tasks, setTasks] = useState<OnboardingTaskTemplate[]>(defaultTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<string>("day_one");

  const { data: templates, isLoading } = useOnboardingTemplates();
  const createTemplate = useCreateOnboardingTemplate();
  const updateTemplate = useUpdateOnboardingTemplate();
  const deleteTemplate = useDeleteOnboardingTemplate();

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
    setTasks(defaultTasks);
    setEditingTemplate(null);
  };

  const openEditDialog = (template: any) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setIsDefault(template.is_default);
    setTasks(template.tasks || defaultTasks);
    setIsCreateOpen(true);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const categoryTasks = tasks.filter(t => t.category === newTaskCategory);
    const newTask: OnboardingTaskTemplate = {
      title: newTaskTitle,
      category: newTaskCategory as any,
      order: categoryTasks.length + 1,
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          name,
          description,
          is_default: isDefault,
          tasks,
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate.mutateAsync({
          name,
          description,
          is_default: isDefault,
          tasks,
        });
        toast.success("Template created successfully");
      }
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success("Template deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const groupedTasks = (taskList: OnboardingTaskTemplate[]) => {
    return taskList.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, OnboardingTaskTemplate[]>);
  };

  return (
    <PageContainer>
      <PageHeader title="Onboarding Templates" description="Create and manage reusable onboarding checklists">
        <Button variant="outline" asChild>
          <Link to="/app/onboarding">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Onboarding Template"}
              </DialogTitle>
              <DialogDescription>
                Define the tasks and checklist for new employee onboarding
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Standard Onboarding"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_default"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                  />
                  <Label htmlFor="is_default">Set as default template</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <Label>Tasks</Label>
                
                {/* Add Task */}
                <div className="flex gap-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                  />
                  <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tasks by Category */}
                {Object.entries(groupedTasks(tasks)).map(([category, categoryTasks]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {categoryLabels[category]}
                    </h4>
                    <div className="space-y-1">
                      {categoryTasks.sort((a, b) => a.order - b.order).map((task, idx) => {
                        const globalIndex = tasks.findIndex(
                          t => t.title === task.title && t.category === task.category
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{task.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveTask(globalIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first onboarding template to get started
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.is_default && (
                      <Badge variant="secondary" className="mt-1">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(groupedTasks(template.tasks || [])).map(([category, tasks]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{categoryLabels[category]}</span>
                      <span className="font-medium">{tasks.length} tasks</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Created {format(new Date(template.created_at), "dd MMM yyyy")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
