import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApplication, useUpdateApplicationStage, useRejectApplication, useScheduleInterview, useInterviews } from "@/hooks/useRecruitment";
import { useEmployees } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Briefcase, Building, Calendar, ExternalLink, ChevronRight, Plus, Video, Clock, User } from "lucide-react";
import { ApplicationStage, InterviewType } from "@/types/recruitment";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stageColors: Record<string, string> = {
  screening: "bg-blue-100 text-blue-800",
  "phone-interview": "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  "hr-interview": "bg-pink-100 text-pink-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const interviewTypeLabels: Record<InterviewType, string> = {
  phone: "Phone Screen",
  video: "Video Call",
  technical: "Technical",
  hr: "HR Interview",
  panel: "Panel",
  final: "Final Round",
};

const stageOrder: ApplicationStage[] = ["screening", "phone-interview", "technical", "hr-interview", "offer", "hired"];

export default function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: application, isLoading } = useApplication(id!);
  const { data: interviews } = useInterviews({ application_id: id });
  const { data: employees } = useEmployees();
  const updateStage = useUpdateApplicationStage();
  const rejectApplication = useRejectApplication();
  const scheduleInterview = useScheduleInterview();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interview_type: "phone" as InterviewType,
    scheduled_at: "",
    duration_minutes: 60,
    interviewer_id: "",
    location_or_link: "",
  });

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  if (!application) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Application not found</p>
          <Button asChild className="mt-4">
            <Link to="/app/recruitment/applications">Back to Applications</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const currentStageIndex = stageOrder.indexOf(application.current_stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageOrder.length - 1 
    ? stageOrder[currentStageIndex + 1] 
    : null;

  const handleReject = async () => {
    await rejectApplication.mutateAsync({ id: application.id, reason: rejectReason });
    setRejectDialogOpen(false);
  };

  const handleScheduleInterview = async () => {
    await scheduleInterview.mutateAsync({
      application_id: application.id,
      ...interviewForm,
      interviewer_id: interviewForm.interviewer_id || undefined,
    });
    setInterviewDialogOpen(false);
    setInterviewForm({
      interview_type: "phone",
      scheduled_at: "",
      duration_minutes: 60,
      interviewer_id: "",
      location_or_link: "",
    });
  };

  return (
    <PageContainer>
      <PageHeader 
        title={application.candidate_name} 
        description={application.job?.title || "Unknown position"}
      >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {application.status === "active" && (
          <Button size="sm" variant="outline" onClick={() => setInterviewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Schedule Interview
          </Button>
        )}
        {application.status === "active" && nextStage && (
          <Button 
            size="sm" 
            onClick={() => updateStage.mutate({ id: application.id, stage: nextStage })}
            disabled={updateStage.isPending}
          >
            Move to {nextStage.replace("-", " ")} <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {application.status === "active" && (
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => setRejectDialogOpen(true)}
          >
            Reject
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Hiring Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {stageOrder.map((stage, index) => {
                  const isActive = application.current_stage === stage;
                  const isPast = currentStageIndex > index;
                  const isRejected = application.status === "rejected";
                  
                  return (
                    <div
                      key={stage}
                      className={`flex-1 min-w-[100px] p-3 rounded-lg text-center text-sm ${
                        isRejected && isActive
                          ? "bg-red-100 text-red-800"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : isPast
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="capitalize font-medium">{stage.replace("-", " ")}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Interviews
                {application.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => setInterviewDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Schedule
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interviews && interviews.length > 0 ? (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{interview.interview_type} Interview</span>
                          <Badge variant={interview.status === "scheduled" ? "default" : interview.status === "completed" ? "secondary" : "destructive"}>
                            {interview.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {interview.duration_minutes} min
                          </span>
                          {interview.interviewer && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {interview.interviewer.first_name} {interview.interviewer.last_name}
                            </span>
                          )}
                        </div>
                        {interview.location_or_link && (
                          <div className="mt-2 text-sm">
                            {interview.location_or_link.startsWith("http") ? (
                              <a href={interview.location_or_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Join meeting
                              </a>
                            ) : (
                              <span className="text-muted-foreground">{interview.location_or_link}</span>
                            )}
                          </div>
                        )}
                        {interview.feedback && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Feedback: </span>{interview.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No interviews scheduled yet</p>
              )}
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.cover_letter && (
                <div>
                  <h4 className="font-medium mb-2">Cover Letter</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{application.cover_letter}</p>
                </div>
              )}
              {application.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{application.notes}</p>
                </div>
              )}
              {application.rejection_reason && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Rejection Reason</h4>
                  <p className="text-muted-foreground">{application.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Candidate Info
                <Badge className={stageColors[application.current_stage]}>
                  {application.current_stage.replace("-", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <a href={`mailto:${application.candidate_email}`} className="text-primary hover:underline">
                    {application.candidate_email}
                  </a>
                </div>
              </div>
              
              {application.candidate_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <a href={`tel:${application.candidate_phone}`} className="text-primary hover:underline">
                      {application.candidate_phone}
                    </a>
                  </div>
                </div>
              )}

              {application.current_company && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Current Company</div>
                    <div>{application.current_company}</div>
                  </div>
                </div>
              )}

              {application.current_designation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Current Role</div>
                    <div>{application.current_designation}</div>
                  </div>
                </div>
              )}

              {application.experience_years !== null && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div>{application.experience_years} years</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Applied On</div>
                  <div>{format(new Date(application.applied_at), "MMM d, yyyy")}</div>
                </div>
              </div>

              {application.source && (
                <div>
                  <div className="text-sm text-muted-foreground">Source</div>
                  <div className="capitalize">{application.source}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          {(application.linkedin_url || application.portfolio_url || application.resume_url) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.resume_url && (
                  <a 
                    href={application.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> View Resume
                  </a>
                )}
                {application.linkedin_url && (
                  <a 
                    href={application.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> LinkedIn Profile
                  </a>
                )}
                {application.portfolio_url && (
                  <a 
                    href={application.portfolio_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> Portfolio
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejecting this application..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectApplication.isPending}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Interview Type</Label>
              <Select
                value={interviewForm.interview_type}
                onValueChange={(value: InterviewType) => setInterviewForm(prev => ({ ...prev, interview_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interviewTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={interviewForm.scheduled_at}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={interviewForm.duration_minutes}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div>
              <Label>Interviewer</Label>
              <Select
                value={interviewForm.interviewer_id}
                onValueChange={(value) => setInterviewForm(prev => ({ ...prev, interviewer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interviewer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.filter(e => e.status === "active").map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location or Meeting Link</Label>
              <Input
                value={interviewForm.location_or_link}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, location_or_link: e.target.value }))}
                placeholder="e.g., https://meet.google.com/... or Room 101"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleInterview} disabled={scheduleInterview.isPending || !interviewForm.scheduled_at}>
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
