import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOffboardingProcesses } from "@/hooks/useOffboarding";
import { format } from "date-fns";
import { Plus, UserMinus, Clock, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OffboardingDashboard() {
  const navigate = useNavigate();
  const { data: processes, isLoading } = useOffboardingProcesses();

  const stats = {
    active: processes?.filter(p => p.status === 'in_progress').length || 0,
    pendingClearance: processes?.filter(p => p.status === 'clearance_pending').length || 0,
    pendingFnF: processes?.filter(p => p.status === 'fnf_pending').length || 0,
    completed: processes?.filter(p => p.status === 'completed').length || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      initiated: { variant: "outline", label: "Initiated" },
      in_progress: { variant: "default", label: "In Progress" },
      clearance_pending: { variant: "secondary", label: "Pending Clearance" },
      fnf_pending: { variant: "destructive", label: "Pending F&F" },
      completed: { variant: "default", label: "Completed" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExitTypeBadge = (type: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      resignation: { variant: "outline", label: "Resignation" },
      termination: { variant: "destructive", label: "Termination" },
      retirement: { variant: "secondary", label: "Retirement" },
      layoff: { variant: "destructive", label: "Layoff" },
    };
    const config = variants[type] || { variant: "outline", label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader title="Offboarding" description="Manage employee exits and clearances">
        <Button onClick={() => navigate('/app/offboarding/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Initiate Exit
        </Button>
      </PageHeader>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Exits</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClearance}</div>
            <p className="text-xs text-muted-foreground">Awaiting clearance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending F&F</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFnF}</div>
            <p className="text-xs text-muted-foreground">Settlement pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Offboarding List */}
      <Card>
        <CardHeader>
          <CardTitle>All Offboarding Processes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : processes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No offboarding processes found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Exit Type</TableHead>
                  <TableHead>Resignation Date</TableHead>
                  <TableHead>Last Working Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes?.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell className="font-medium">
                      {process.employee?.first_name} {process.employee?.last_name}
                      <div className="text-xs text-muted-foreground">
                        {process.employee?.employee_id}
                      </div>
                    </TableCell>
                    <TableCell>{getExitTypeBadge(process.exit_type)}</TableCell>
                    <TableCell>
                      {process.resignation_date && format(new Date(process.resignation_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {process.last_working_day && format(new Date(process.last_working_day), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(process.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/offboarding/${process.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
