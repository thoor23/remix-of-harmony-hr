import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRecruitmentStats, usePipelineStats, useApplications, useInterviews, useJobOpenings } from "@/hooks/useRecruitment";
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Briefcase, Users, Calendar, Clock, TrendingUp, Target, Award, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, differenceInDays } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const stageLabels: Record<string, string> = {
  screening: "Screening",
  "phone-interview": "Phone Interview",
  technical: "Technical",
  "hr-interview": "HR Interview",
  offer: "Offer",
  hired: "Hired",
};

export default function RecruitmentAnalytics() {
  const { data: stats, isLoading: statsLoading } = useRecruitmentStats();
  const { data: pipeline, isLoading: pipelineLoading } = usePipelineStats();
  const { data: applications } = useApplications();
  const { data: interviews } = useInterviews();
  const { data: jobs } = useJobOpenings();

  // Calculate pipeline funnel data
  const funnelData = useMemo(() => {
    if (!pipeline) return [];
    const stages = ["screening", "phone-interview", "technical", "hr-interview", "offer", "hired"];
    return stages.map((stage, index) => ({
      name: stageLabels[stage],
      value: pipeline[stage as keyof typeof pipeline] || 0,
      fill: COLORS[index % COLORS.length],
    }));
  }, [pipeline]);

  // Source analysis
  const sourceData = useMemo(() => {
    if (!applications) return [];
    const sources = applications.reduce((acc, app) => {
      const source = app.source || "other";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sources).map(([name, value], i) => ({
      name: name.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()),
      value,
      fill: COLORS[i % COLORS.length],
    }));
  }, [applications]);

  // Time to hire calculation
  const timeToHireData = useMemo(() => {
    if (!applications) return { average: 0, data: [] };
    
    const hiredApps = applications.filter(a => a.status === "hired");
    if (hiredApps.length === 0) return { average: 0, data: [] };

    const times = hiredApps.map(app => {
      const appliedDate = parseISO(app.applied_at);
      const hiredDate = parseISO(app.updated_at);
      return differenceInDays(hiredDate, appliedDate);
    });

    const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    
    return { average, data: [] };
  }, [applications]);

  // Applications trend (last 30 days)
  const trendData = useMemo(() => {
    if (!applications) return [];
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, "MMM d"),
        applications: 0,
      };
    });

    applications.forEach(app => {
      const appDate = format(parseISO(app.applied_at), "MMM d");
      const dayData = last30Days.find(d => d.date === appDate);
      if (dayData) dayData.applications++;
    });

    return last30Days;
  }, [applications]);

  // Interview load by interviewer
  const interviewerLoad = useMemo(() => {
    if (!interviews) return [];
    
    const load = interviews.reduce((acc, int) => {
      if (!int.interviewer) return acc;
      const name = `${int.interviewer.first_name} ${int.interviewer.last_name}`;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(load)
      .map(([name, count]) => ({ name, interviews: count }))
      .sort((a, b) => b.interviews - a.interviews)
      .slice(0, 10);
  }, [interviews]);

  // Offer acceptance rate
  const offerStats = useMemo(() => {
    if (!applications) return { offered: 0, accepted: 0, rate: 0 };
    
    const offered = applications.filter(a => a.current_stage === "offer" || a.current_stage === "hired").length;
    const accepted = applications.filter(a => a.current_stage === "hired").length;
    const rate = offered > 0 ? Math.round((accepted / offered) * 100) : 0;

    return { offered, accepted, rate };
  }, [applications]);

  // Rejection reasons
  const rejectionReasons = useMemo(() => {
    if (!applications) return [];
    
    const rejected = applications.filter(a => a.status === "rejected");
    const reasons = rejected.reduce((acc, app) => {
      const stage = stageLabels[app.current_stage] || app.current_stage;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(reasons).map(([stage, count]) => ({
      stage,
      count,
    }));
  }, [applications]);

  if (statsLoading || pipelineLoading) {
    return (
      <PageContainer>
        <PageHeader title="Recruitment Analytics" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Recruitment Analytics" 
        description="Comprehensive recruitment metrics and insights"
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold">{stats?.open_positions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-2/10">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats?.total_applications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-3/10">
                <Clock className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time to Hire</p>
                <p className="text-2xl font-bold">{timeToHireData.average} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-4/10">
                <Target className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offer Acceptance</p>
                <p className="text-2xl font-bold">{offerStats.rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline</CardTitle>
            <CardDescription>Candidates at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Application Sources</CardTitle>
            <CardDescription>Where candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Applications Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Trend</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interviewer Load */}
        <Card>
          <CardHeader>
            <CardTitle>Interviewer Workload</CardTitle>
            <CardDescription>Interviews by interviewer</CardDescription>
          </CardHeader>
          <CardContent>
            {interviewerLoad.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No interview data available
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interviewerLoad} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="interviews" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats?.interviews_today || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Pending Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats?.pending_offers || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Hired This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pipeline?.hired || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Successfully onboarded</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
