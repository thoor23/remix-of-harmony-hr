import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  LayoutTemplate,
  Plus,
  Eye,
  MoreHorizontal
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingProcesses, useOnboardingStats } from "@/hooks/useOnboarding";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OnboardingDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: processes, isLoading } = useOnboardingProcesses(activeTab === "all" ? undefined : activeTab);
  const { data: stats, isLoading: statsLoading } = useOnboardingStats();

  const calculateProgress = (process: any) => {
    if (!process.tasks || process.tasks.length === 0) return 0;
    const completed = process.tasks.filter((t: any) => t.status === "completed").length;
    return Math.round((completed / process.tasks.length) * 100);
  };

  return (
    <PageContainer
      title="Employee Onboarding"
      description="Manage new employee onboarding processes and track their progress"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/onboarding/templates">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/onboarding/new">
              <Plus className="h-4 w-4 mr-2" />
              Start Onboarding
            </Link>
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Onboardings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Start</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting initiation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.completed_this_month || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Successfully onboarded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats?.overdue_tasks || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding List */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Processes</CardTitle>
          <CardDescription>Track and manage employee onboarding journeys</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !processes || processes.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No onboarding processes</h3>
                  <p className="text-muted-foreground mb-4">
                    Start onboarding a new employee to see them here
                  </p>
                  <Button asChild>
                    <Link to="/app/onboarding/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Start Onboarding
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processes.map((process) => {
                      const progress = calculateProgress(process);
                      return (
                        <TableRow key={process.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={process.employee?.avatar_url || ""} />
                                <AvatarFallback>
                                  {process.employee?.first_name?.[0]}
                                  {process.employee?.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {process.employee?.first_name} {process.employee?.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {process.employee?.employee_id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{process.employee?.department?.name || "-"}</div>
                              <div className="text-sm text-muted-foreground">
                                {process.employee?.designation?.name || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(process.start_date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="w-20 h-2" />
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[process.status]}>
                              {statusLabels[process.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/app/onboarding/${process.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
