import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInterviews } from "@/hooks/useRecruitment";
import { useEmployees } from "@/hooks/useEmployees";
import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO, 
  addMonths, 
  subMonths,
  isToday,
  addWeeks,
  subWeeks
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, List, Video, Phone, User, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { InterviewSchedule, InterviewType } from "@/types/recruitment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const interviewTypeColors: Record<InterviewType, string> = {
  phone: "bg-blue-500",
  video: "bg-purple-500",
  technical: "bg-orange-500",
  hr: "bg-pink-500",
  panel: "bg-indigo-500",
  final: "bg-green-500",
};

const interviewTypeLabels: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  technical: "Technical",
  hr: "HR",
  panel: "Panel",
  final: "Final",
};

export default function InterviewCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSchedule | null>(null);
  const [filterInterviewer, setFilterInterviewer] = useState<string>("all");
  
  const { data: interviews, isLoading } = useInterviews();
  const { data: employees } = useEmployees();
  const navigate = useNavigate();

  const interviewers = useMemo(() => {
    if (!interviews) return [];
    const unique = new Map<string, { id: string; name: string }>();
    interviews.forEach(i => {
      if (i.interviewer) {
        unique.set(i.interviewer.id, {
          id: i.interviewer.id,
          name: `${i.interviewer.first_name} ${i.interviewer.last_name}`
        });
      }
    });
    return Array.from(unique.values());
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    if (!interviews) return [];
    if (filterInterviewer === "all") return interviews;
    return interviews.filter(i => i.interviewer?.id === filterInterviewer);
  }, [interviews, filterInterviewer]);

  const calendarDays = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, view]);

  const getInterviewsForDay = (day: Date) => {
    return filteredInterviews.filter(i => isSameDay(parseISO(i.scheduled_at), day));
  };

  const handlePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const dayInterviewsList = selectedDay ? getInterviewsForDay(selectedDay) : [];

  return (
    <PageContainer>
      <PageHeader 
        title="Interview Calendar" 
        description="View interviews in calendar format"
      >
        <Button variant="outline" asChild>
          <Link to="/app/recruitment/interviews">
            <List className="h-4 w-4 mr-2" /> List View
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>Today</Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-4">
                {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterInterviewer} onValueChange={setFilterInterviewer}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by interviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Interviewers</SelectItem>
                  {interviewers.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={view} onValueChange={(v: "month" | "week") => setView(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm">
            {Object.entries(interviewTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={cn("w-3 h-3 rounded-full", interviewTypeColors[type as InterviewType])} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const dayInterviews = getInterviewsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        !isCurrentMonth && "opacity-40",
                        today && "border-primary",
                        selectedDay && isSameDay(day, selectedDay) && "bg-muted"
                      )}
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        today && "text-primary"
                      )}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayInterviews.slice(0, 3).map((interview) => (
                          <div
                            key={interview.id}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80",
                              interviewTypeColors[interview.interview_type]
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInterview(interview);
                            }}
                          >
                            {format(parseISO(interview.scheduled_at), "HH:mm")} - {interview.application?.candidate_name?.split(" ")[0]}
                          </div>
                        ))}
                        {dayInterviews.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayInterviews.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Interviews on {selectedDay && format(selectedDay, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          {dayInterviewsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No interviews scheduled</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {dayInterviewsList.map((interview) => (
                <div
                  key={interview.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedDay(null);
                    navigate(`/app/recruitment/applications/${interview.application_id}`);
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-2 h-2 rounded-full", interviewTypeColors[interview.interview_type])} />
                    <span className="font-medium">{interview.application?.candidate_name}</span>
                    <Badge variant="outline" className="ml-auto capitalize">
                      {interview.interview_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(interview.scheduled_at), "h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {interview.interviewer 
                        ? `${interview.interviewer.first_name} ${interview.interviewer.last_name}`
                        : "Not assigned"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {interview.application?.job?.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interview Detail Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedInterview.application?.candidate_name}</h3>
                <p className="text-muted-foreground">{selectedInterview.application?.job?.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="capitalize">{selectedInterview.interview_type} Interview</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Round</p>
                  <p>Round {selectedInterview.interview_round}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p>{format(parseISO(selectedInterview.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p>{selectedInterview.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interviewer</p>
                  <p>
                    {selectedInterview.interviewer 
                      ? `${selectedInterview.interviewer.first_name} ${selectedInterview.interviewer.last_name}`
                      : "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedInterview.status === "completed" ? "secondary" : "default"}>
                    {selectedInterview.status}
                  </Badge>
                </div>
              </div>

              {selectedInterview.location_or_link && (
                <div>
                  <p className="text-sm text-muted-foreground">Location/Link</p>
                  {selectedInterview.location_or_link.startsWith("http") ? (
                    <a 
                      href={selectedInterview.location_or_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Join Meeting
                    </a>
                  ) : (
                    <p>{selectedInterview.location_or_link}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedInterview(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setSelectedInterview(null);
                  navigate(`/app/recruitment/applications/${selectedInterview.application_id}`);
                }}>
                  View Application
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
