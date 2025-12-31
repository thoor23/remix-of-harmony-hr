import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOffboardingProcess, useUpdateOffboardingTask } from "@/hooks/useOffboarding";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, FileText, ClipboardCheck, DollarSign, MessageSquare } from "lucide-react";

export default function OffboardingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: process, isLoading } = useOffboardingProcess(id!);
  const { mutateAsync: updateTask } = useUpdateOffboardingTask();

  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    setUpdatingTask(taskId);
    try {
      await updateTask({
        offboardingId: id!,
        taskId,
        status: completed ? 'completed' : 'pending',
        completed_at: completed ? new Date().toISOString() : null,
      });
      toast.success(completed ? "Task completed" : "Task marked as pending");
    } catch (error) {
      toast.error("Failed to update task");
    } finally {
      setUpdatingTask(null);
    }
  };

  const getTasksByCategory = (category: string) => {
    return process?.tasks?.filter((t: any) => t.category === category) || [];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      initiated: { variant: "outline", label: "Initiated" },
      in_progress: { variant: "default", label: "In Progress" },
      pending_clearance: { variant: "secondary", label: "Pending Clearance" },
      pending_fnf: { variant: "destructive", label: "Pending F&F" },
      completed: { variant: "default", label: "Completed" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Offboarding Details">
          <Button variant="outline" onClick={() => navigate('/app/offboarding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!process) {
    return (
      <PageContainer>
        <PageHeader title="Offboarding Details">
          <Button variant="outline" onClick={() => navigate('/app/offboarding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </PageHeader>
        <div className="text-center py-12 text-muted-foreground">
          Offboarding process not found
        </div>
      </PageContainer>
    );
  }

  const completedTasks = process.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const totalTasks = process.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <PageContainer>
      <PageHeader 
        title={`Exit: ${process.employee?.first_name} ${process.employee?.last_name}`}
        description={process.employee?.employee_id}
      >
        <Button variant="outline" onClick={() => navigate('/app/offboarding')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>
      {/* Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Exit Type</div>
              <div className="font-medium capitalize">{process.exit_type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Resignation Date</div>
              <div className="font-medium">
                {process.resignation_date && format(new Date(process.resignation_date), 'dd MMM yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Working Day</div>
              <div className="font-medium">
                {process.last_working_day && format(new Date(process.last_working_day), 'dd MMM yyyy')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Notice Period</div>
              <div className="font-medium">{process.notice_period_days} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div>{getStatusBadge(process.status)}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Clearance Progress</span>
              <span>{completedTasks}/{totalTasks} tasks ({progress}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="clearance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clearance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Clearance
          </TabsTrigger>
          <TabsTrigger value="interview">
            <MessageSquare className="h-4 w-4 mr-2" />
            Exit Interview
          </TabsTrigger>
          <TabsTrigger value="fnf">
            <DollarSign className="h-4 w-4 mr-2" />
            F&F Settlement
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Clearance Tasks */}
        <TabsContent value="clearance" className="space-y-4 mt-4">
          {['knowledge_transfer', 'asset_return', 'access_revocation', 'documentation'].map((category) => {
            const tasks = getTasksByCategory(category);
            if (tasks.length === 0) return null;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {category.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                          disabled={updatingTask === task.id}
                        />
                        <div className="flex-1">
                          <div className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          )}
                        </div>
                        {task.status === 'completed' && task.completed_at && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(task.completed_at), 'dd MMM')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {totalTasks === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No clearance tasks defined for this process
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Exit Interview */}
        <TabsContent value="interview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Interview</CardTitle>
            </CardHeader>
            <CardContent>
              {process.exit_interview ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Interview Date</div>
                    <div>{format(new Date(process.exit_interview.interview_date), 'dd MMM yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reason for Leaving</div>
                    <div>{process.exit_interview.reason_for_leaving || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Would Rejoin?</div>
                    <div>{process.exit_interview.would_rejoin ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Exit interview not conducted yet</p>
                  <Button onClick={() => navigate(`/app/offboarding/${id}/interview`)}>
                    Conduct Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* F&F Settlement */}
        <TabsContent value="fnf" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Full & Final Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              {process.fnf_settlement ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Pending Salary</div>
                      <div className="font-medium">₹{process.fnf_settlement.pending_salary_amount?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Leave Encashment</div>
                      <div className="font-medium">₹{process.fnf_settlement.leave_encashment_amount?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Deductions</div>
                      <div className="font-medium text-destructive">-₹{process.fnf_settlement.total_deductions?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Final Amount</div>
                      <div className="font-bold text-lg">₹{process.fnf_settlement.final_amount?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  <Badge variant={process.fnf_settlement.status === 'processed' ? 'default' : 'secondary'}>
                    {process.fnf_settlement.status}
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  F&F settlement not calculated yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => navigate('/app/letters/relieving')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Relieving Letter
                </Button>
                <Button variant="outline" onClick={() => navigate('/app/letters/experience')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Experience Letter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
