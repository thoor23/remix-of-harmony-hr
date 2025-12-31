import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock,
  User,
  Building2,
  Calendar,
  FileText,
  MoreHorizontal
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useOnboardingProcess, 
  useUpdateOnboardingProcess,
  useUpdateOnboardingTask 
} from "@/hooks/useOnboarding";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
  skipped: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  skipped: "Skipped",
};

const categoryLabels: Record<string, string> = {
  pre_joining: "Pre-Joining",
  day_one: "Day One",
  week_one: "First Week",
  month_one: "First Month",
};

const categoryIcons: Record<string, React.ElementType> = {
  pre_joining: FileText,
  day_one: Calendar,
  week_one: Clock,
  month_one: CheckCircle2,
};

export default function OnboardingDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeCategory, setActiveCategory] = useState("all");
  
  const { data: process, isLoading } = useOnboardingProcess(id || "");
  const updateProcess = useUpdateOnboardingProcess();
  const updateTask = useUpdateOnboardingTask();

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!process) {
    return (
      <PageContainer title="Not Found">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Onboarding process not found</p>
            <Button asChild className="mt-4">
              <Link to="/app/onboarding">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const tasks = process.tasks || [];
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const filteredTasks = activeCategory === "all" 
    ? tasks 
    : tasks.filter(t => t.category === activeCategory);

  const handleTaskToggle = async (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateTask.mutateAsync({
        onboardingId: process.id,
        taskId: task.id,
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      });
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProcess.mutateAsync({
        id: process.id,
        status: newStatus,
      });
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <PageContainer
      title={`Onboarding: ${process.employee?.first_name} ${process.employee?.last_name}`}
      description="Track and manage onboarding progress"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/onboarding">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Select value={process.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Info & Progress */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={process.employee?.avatar_url || ""} />
                  <AvatarFallback className="text-lg">
                    {process.employee?.first_name?.[0]}
                    {process.employee?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {process.employee?.first_name} {process.employee?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {process.employee?.employee_id}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{process.employee?.department?.name || "No Department"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{process.employee?.designation?.name || "No Designation"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {format(new Date(process.start_date), "dd MMM yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{tasks.length - completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(categoryLabels).map(([category, label]) => {
                const categoryTasks = groupedTasks[category] || [];
                const completed = categoryTasks.filter(t => t.status === "completed").length;
                const Icon = categoryIcons[category];
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <Badge variant="secondary">
                      {completed}/{categoryTasks.length}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Onboarding Tasks</CardTitle>
                  <CardDescription>
                    Complete tasks to progress the onboarding
                  </CardDescription>
                </div>
                <Badge className={statusColors[process.status]}>
                  {statusLabels[process.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <TabsTrigger key={value} value={value}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeCategory} className="mt-0">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks in this category
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTasks
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              task.status === "completed" 
                                ? "bg-green-500/5 border-green-500/20" 
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              checked={task.status === "completed"}
                              onCheckedChange={() => handleTaskToggle(task)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${
                                task.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}>
                                {task.title}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {categoryLabels[task.category]}
                                </Badge>
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground">
                                    Due: {format(new Date(task.due_date), "dd MMM")}
                                  </span>
                                )}
                                {task.completed_at && (
                                  <span className="text-xs text-green-600">
                                    Completed: {format(new Date(task.completed_at), "dd MMM")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleTaskToggle(task)}
                                >
                                  {task.status === "completed" ? (
                                    <>
                                      <Circle className="h-4 w-4 mr-2" />
                                      Mark Pending
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
