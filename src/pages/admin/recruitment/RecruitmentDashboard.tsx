import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Calendar, Gift, Plus, Eye } from "lucide-react";
import { useRecruitmentStats, usePipelineStats, useApplications, useJobOpenings } from "@/hooks/useRecruitment";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const stageBadgeColors: Record<string, string> = {
  screening: "bg-blue-100 text-blue-800",
  "phone-interview": "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  "hr-interview": "bg-pink-100 text-pink-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-emerald-100 text-emerald-800",
};

export default function RecruitmentDashboard() {
  const { data: stats, isLoading: statsLoading } = useRecruitmentStats();
  const { data: pipeline, isLoading: pipelineLoading } = usePipelineStats();
  const { data: recentApps } = useApplications({ status: "active" });
  const { data: openJobs } = useJobOpenings({ status: "open" });

  const statCards = [
    { title: "Open Positions", value: stats?.open_positions || 0, icon: Briefcase, color: "text-blue-600" },
    { title: "Total Applications", value: stats?.total_applications || 0, icon: Users, color: "text-purple-600" },
    { title: "Interviews Today", value: stats?.interviews_today || 0, icon: Calendar, color: "text-orange-600" },
    { title: "Pending Offers", value: stats?.pending_offers || 0, icon: Gift, color: "text-green-600" },
  ];

  return (
    <PageContainer
      title="Recruitment"
      description="Manage job openings and track candidates"
      actions={
        <Button asChild>
          <Link to="/app/recruitment/jobs/create"><Plus className="h-4 w-4 mr-2" /> Post New Job</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{card.value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <div className="flex gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 flex-1" />)}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto">
                {Object.entries(pipeline || {}).map(([stage, count]) => (
                  <div key={stage} className={`flex-1 min-w-[100px] p-4 rounded-lg text-center ${stageBadgeColors[stage] || "bg-gray-100"}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs capitalize">{stage.replace("-", " ")}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/recruitment/applications">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentApps?.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{app.candidate_name}</div>
                    <div className="text-sm text-muted-foreground">{app.job?.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={stageBadgeColors[app.current_stage]}>{app.current_stage.replace("-", " ")}</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/app/recruitment/applications/${app.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">No recent applications</p>}
            </CardContent>
          </Card>

          {/* Open Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Open Positions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/recruitment/jobs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {openJobs?.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-muted-foreground">{job.department?.name} • {job.location || "Remote"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{Array.isArray(job.applications) ? job.applications.length : 0} applicants</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/app/recruitment/jobs/${job.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">No open positions</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
