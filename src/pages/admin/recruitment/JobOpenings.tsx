import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, MoreHorizontal } from "lucide-react";
import { useJobOpenings, useUpdateJobStatus } from "@/hooks/useRecruitment";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  open: "bg-green-100 text-green-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  closed: "bg-red-100 text-red-800",
  filled: "bg-blue-100 text-blue-800",
};

export default function JobOpenings() {
  const { data: jobs, isLoading } = useJobOpenings();
  const updateStatus = useUpdateJobStatus();

  return (
    <PageContainer>
      <PageHeader title="Job Openings" description="Manage your job postings">
        <Button asChild>
          <Link to="/app/recruitment/jobs/create">
            <Plus className="h-4 w-4 mr-2" /> Post New Job
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : jobs?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No job openings yet</TableCell></TableRow>
              ) : (
                jobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department?.name || "-"}</TableCell>
                    <TableCell>{job.location || "Remote"}</TableCell>
                    <TableCell><Badge className={statusColors[job.status]}>{job.status}</Badge></TableCell>
                    <TableCell>{Array.isArray(job.applications) ? job.applications.length : 0}</TableCell>
                    <TableCell>{job.posted_date ? format(new Date(job.posted_date), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={`/app/recruitment/jobs/${job.id}`}><Eye className="h-4 w-4 mr-2" /> View</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link to={`/app/recruitment/jobs/${job.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link></DropdownMenuItem>
                          {job.status === "draft" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "open" })}>Publish</DropdownMenuItem>}
                          {job.status === "open" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "closed" })}>Close</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
