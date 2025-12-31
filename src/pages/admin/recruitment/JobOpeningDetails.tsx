import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useJobOpening, useUpdateJobStatus, useApplications } from "@/hooks/useRecruitment";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Edit, Users, MapPin, Briefcase, Calendar, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  open: "bg-green-100 text-green-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  closed: "bg-red-100 text-red-800",
  filled: "bg-blue-100 text-blue-800",
};

const stageColors: Record<string, string> = {
  screening: "bg-blue-100 text-blue-800",
  "phone-interview": "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  "hr-interview": "bg-pink-100 text-pink-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function JobOpeningDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJobOpening(id!);
  const { data: applications } = useApplications({ job_id: id });
  const updateStatus = useUpdateJobStatus();

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  if (!job) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job opening not found</p>
          <Button asChild className="mt-4">
            <Link to="/app/recruitment/jobs">Back to Job Openings</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={job.title} description={job.department?.name || "No department"}>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/recruitment/jobs/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Link>
        </Button>
        {job.status === "draft" && (
          <Button size="sm" onClick={() => updateStatus.mutate({ id: job.id, status: "open" })}>
            Publish
          </Button>
        )}
        {job.status === "open" && (
          <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: job.id, status: "closed" })}>
            Close Position
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Job Details
                <Badge className={statusColors[job.status]}>{job.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Applications ({applications?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {applications && applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/app/recruitment/applications/${app.id}`)}>
                        <TableCell>
                          <div className="font-medium">{app.candidate_name}</div>
                          <div className="text-sm text-muted-foreground">{app.candidate_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={stageColors[app.current_stage]}>{app.current_stage.replace("-", " ")}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(app.applied_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="capitalize">{app.source || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No applications yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{job.location || "Remote"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Employment Type</div>
                  <div className="capitalize">{job.employment_type.replace("-", " ")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Openings</div>
                  <div>{job.openings_count}</div>
                </div>
              </div>
              {job.show_salary && (job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Salary Range</div>
                    <div>
                      {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Posted</div>
                  <div>{job.posted_date ? format(new Date(job.posted_date), "MMM d, yyyy") : "Not published"}</div>
                </div>
              </div>
              {job.closing_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Closing Date</div>
                    <div>{format(new Date(job.closing_date), "MMM d, yyyy")}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
