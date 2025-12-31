import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal } from "lucide-react";
import { useApplications, useUpdateApplicationStage } from "@/hooks/useRecruitment";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { ApplicationStage } from "@/types/recruitment";

const stageBadgeColors: Record<string, string> = {
  screening: "bg-blue-100 text-blue-800",
  "phone-interview": "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  "hr-interview": "bg-pink-100 text-pink-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const stageOrder: ApplicationStage[] = ["screening", "phone-interview", "technical", "hr-interview", "offer", "hired"];

export default function Applications() {
  const { data: applications, isLoading } = useApplications();
  const updateStage = useUpdateApplicationStage();

  const getNextStage = (current: ApplicationStage): ApplicationStage | null => {
    const idx = stageOrder.indexOf(current);
    return idx >= 0 && idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;
  };

  return (
    <PageContainer>
      <PageHeader title="Applications" description="Track and manage all candidate applications" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : applications?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No applications yet</TableCell></TableRow>
              ) : (
                applications?.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.candidate_name}</div>
                      <div className="text-sm text-muted-foreground">{app.candidate_email}</div>
                    </TableCell>
                    <TableCell>{app.job?.title || "-"}</TableCell>
                    <TableCell><Badge className={stageBadgeColors[app.current_stage]}>{app.current_stage.replace("-", " ")}</Badge></TableCell>
                    <TableCell className="capitalize">{app.source}</TableCell>
                    <TableCell>{format(new Date(app.applied_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={`/app/recruitment/applications/${app.id}`}><Eye className="h-4 w-4 mr-2" /> View Details</Link></DropdownMenuItem>
                          {app.status === "active" && getNextStage(app.current_stage) && (
                            <DropdownMenuItem onClick={() => updateStage.mutate({ id: app.id, stage: getNextStage(app.current_stage)! })}>
                              Move to {getNextStage(app.current_stage)?.replace("-", " ")}
                            </DropdownMenuItem>
                          )}
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
