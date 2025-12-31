import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInterviews, useMyInterviews, useUpdateInterview, useDeleteInterview, useSubmitInterviewFeedback } from "@/hooks/useRecruitment";
import { useEmployees } from "@/hooks/useEmployees";
import { useState } from "react";
import { format, isToday, isFuture, parseISO, startOfDay, endOfDay } from "date-fns";
import { Calendar, Clock, User, Video, Phone, Users, Filter, Search, X, MoreHorizontal, Eye, MessageSquare, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { InterviewSchedule, InterviewType } from "@/types/recruitment";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";

const interviewTypeIcons: Record<InterviewType, React.ElementType> = {
  phone: Phone,
  video: Video,
  technical: User,
  hr: Users,
  panel: Users,
  final: Users,
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "no-show": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function Interviews() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [selectedInterview, setSelectedInterview] = useState<InterviewSchedule | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 3, feedback: "", recommendation: "consider" });
  
  const { data: allInterviews, isLoading } = useInterviews();
  const { data: myInterviews } = useMyInterviews();
  const { data: employees } = useEmployees();
  const updateInterview = useUpdateInterview();
  const deleteInterview = useDeleteInterview();
  const submitFeedback = useSubmitInterviewFeedback();

  const filterInterviews = (interviews: InterviewSchedule[] | undefined) => {
    if (!interviews) return [];
    
    let filtered = interviews;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(i => 
        i.application?.candidate_name?.toLowerCase().includes(searchLower) ||
        i.application?.job?.title?.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(i => i.interview_type === filterType);
    }
    
    // Date filter
    if (filterDate) {
      filtered = filtered.filter(i => {
        const interviewDate = parseISO(i.scheduled_at);
        return interviewDate >= startOfDay(filterDate) && interviewDate <= endOfDay(filterDate);
      });
    }
    
    // Tab filter
    if (tab === "today") {
      filtered = filtered.filter(i => isToday(parseISO(i.scheduled_at)));
    } else if (tab === "upcoming") {
      filtered = filtered.filter(i => isFuture(parseISO(i.scheduled_at)) && i.status === "scheduled");
    } else if (tab === "my") {
      filtered = myInterviews || [];
    }
    
    return filtered.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };

  const interviews = filterInterviews(tab === "my" ? myInterviews : allInterviews);
  const todayCount = allInterviews?.filter(i => isToday(parseISO(i.scheduled_at))).length || 0;
  const upcomingCount = allInterviews?.filter(i => isFuture(parseISO(i.scheduled_at)) && i.status === "scheduled").length || 0;

  const handleCancelInterview = async (id: string) => {
    await updateInterview.mutateAsync({ id, data: { status: "cancelled" } });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedInterview) return;
    await submitFeedback.mutateAsync({
      id: selectedInterview.id,
      data: {
        rating: feedback.rating,
        feedback: feedback.feedback,
        recommendation: feedback.recommendation as "proceed" | "reject" | "on-hold",
      }
    });
    setFeedbackDialogOpen(false);
    setSelectedInterview(null);
    setFeedback({ rating: 3, feedback: "", recommendation: "proceed" });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Interview Management" 
        description="View and manage all scheduled interviews"
      >
        <Button asChild>
          <Link to="/app/recruitment/interviews/calendar">
            <Calendar className="h-4 w-4 mr-2" /> Calendar View
          </Link>
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Interviews</TabsTrigger>
            <TabsTrigger value="today">
              Today
              {todayCount > 0 && (
                <Badge variant="secondary" className="ml-2">{todayCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="ml-2">{upcomingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my">My Interviews</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidate or job..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
            <DatePicker
              value={filterDate ? format(filterDate, "yyyy-MM-dd") : undefined}
              onChange={(v) => setFilterDate(v ? new Date(v) : undefined)}
              placeholder="Filter by date"
            />
            {(search || filterType !== "all" || filterDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
                  setFilterDate(undefined);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : interviews.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No interviews found</h3>
                <p className="text-muted-foreground text-sm">
                  {tab === "today" ? "No interviews scheduled for today" :
                   tab === "upcoming" ? "No upcoming interviews" :
                   tab === "my" ? "You don't have any interviews assigned" :
                   "No interviews match your filters"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => {
                    const TypeIcon = interviewTypeIcons[interview.interview_type] || User;
                    return (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <Link 
                            to={`/app/recruitment/applications/${interview.application_id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {interview.application?.candidate_name || "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {interview.application?.job?.title || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{interview.interview_type}</span>
                            {interview.interview_round > 1 && (
                              <Badge variant="outline" className="text-xs">
                                Round {interview.interview_round}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(interview.scheduled_at), "MMM d, yyyy")}</span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{format(parseISO(interview.scheduled_at), "h:mm a")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {interview.interviewer ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {interview.interviewer.first_name} {interview.interviewer.last_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[interview.status]}>
                            {interview.status}
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
                                <Link to={`/app/recruitment/applications/${interview.application_id}`}>
                                  <Eye className="h-4 w-4 mr-2" /> View Application
                                </Link>
                              </DropdownMenuItem>
                              {interview.status === "scheduled" && (
                                <>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedInterview(interview);
                                    setFeedbackDialogOpen(true);
                                  }}>
                                    <MessageSquare className="h-4 w-4 mr-2" /> Add Feedback
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleCancelInterview(interview.id)}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Interview Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating (1-5)</Label>
              <Select
                value={feedback.rating.toString()}
                onValueChange={(v) => setFeedback(prev => ({ ...prev, rating: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} - {
                      n === 1 ? "Poor" : n === 2 ? "Below Average" : n === 3 ? "Average" : n === 4 ? "Good" : "Excellent"
                    }</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recommendation</Label>
              <Select
                value={feedback.recommendation}
                onValueChange={(v) => setFeedback(prev => ({ ...prev, recommendation: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proceed">Proceed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea
                value={feedback.feedback}
                onChange={(e) => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Detailed feedback about the candidate..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitFeedback} disabled={submitFeedback.isPending}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
