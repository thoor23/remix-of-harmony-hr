import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Search, Briefcase, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useApplications } from "@/hooks/useRecruitment";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ApplicationStage } from "@/types/recruitment";

const stageOrder: ApplicationStage[] = ["screening", "phone-interview", "technical", "hr-interview", "offer", "hired"];

const stageLabels: Record<string, string> = {
  "screening": "Application Review",
  "phone-interview": "Phone Screen",
  "technical": "Technical Interview",
  "hr-interview": "HR Interview",
  "offer": "Offer Stage",
  "hired": "Hired",
  "rejected": "Not Selected",
};

const stageIcons: Record<string, React.ReactNode> = {
  "screening": <Clock className="h-4 w-4" />,
  "phone-interview": <Calendar className="h-4 w-4" />,
  "technical": <AlertCircle className="h-4 w-4" />,
  "hr-interview": <AlertCircle className="h-4 w-4" />,
  "offer": <CheckCircle2 className="h-4 w-4" />,
  "hired": <CheckCircle2 className="h-4 w-4" />,
  "rejected": <XCircle className="h-4 w-4" />,
};

export default function ApplicationStatus() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  
  const { data: applications, isLoading, refetch } = useApplications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedEmail(email.trim().toLowerCase());
    refetch();
  };

  const filteredApplications = applications?.filter(
    (app) => app.candidate_email.toLowerCase() === searchedEmail
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Careers</span>
          </Link>
          <Link to="/careers">
            <Button variant="outline" size="sm">
              View Open Positions
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Check Application Status</h1>
          <p className="text-muted-foreground">
            Enter your email address to view the status of your applications.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Label className="sr-only">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searchedEmail && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {filteredApplications.length} application(s) for <strong>{searchedEmail}</strong>
                </p>
                {filteredApplications.map((application) => {
                  const currentStageIndex = stageOrder.indexOf(application.current_stage);
                  const isRejected = application.status === "rejected";
                  const isHired = application.status === "hired";

                  return (
                    <Card key={application.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg">{application.job?.title || "Position"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Applied on {format(new Date(application.applied_at), "MMMM d, yyyy")}
                            </p>
                          </div>
                          <Badge 
                            variant={isRejected ? "destructive" : isHired ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {stageLabels[application.current_stage] || application.current_stage}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress Pipeline */}
                        <div className="relative">
                          <div className="flex justify-between mb-2">
                            {stageOrder.map((stage, index) => {
                              const isActive = application.current_stage === stage;
                              const isPast = currentStageIndex > index;
                              const isRejectedStage = isRejected && isActive;

                              return (
                                <div
                                  key={stage}
                                  className={`flex-1 text-center ${index > 0 ? "relative" : ""}`}
                                >
                                  {index > 0 && (
                                    <div 
                                      className={`absolute top-3 left-0 right-1/2 h-0.5 -translate-y-1/2 ${
                                        isPast || isActive ? "bg-primary" : "bg-muted"
                                      }`} 
                                    />
                                  )}
                                  {index < stageOrder.length - 1 && (
                                    <div 
                                      className={`absolute top-3 left-1/2 right-0 h-0.5 -translate-y-1/2 ${
                                        isPast ? "bg-primary" : "bg-muted"
                                      }`} 
                                    />
                                  )}
                                  <div
                                    className={`relative z-10 w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs ${
                                      isRejectedStage
                                        ? "bg-destructive text-destructive-foreground"
                                        : isActive || isPast
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isPast ? "✓" : index + 1}
                                  </div>
                                  <p className={`text-xs mt-1 hidden sm:block ${
                                    isActive ? "font-medium" : "text-muted-foreground"
                                  }`}>
                                    {stageLabels[stage]?.split(" ")[0]}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status Message */}
                        <div className={`p-4 rounded-lg ${
                          isRejected 
                            ? "bg-destructive/10 text-destructive" 
                            : isHired 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-muted"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {stageIcons[application.current_stage]}
                            </div>
                            <div>
                              <p className="font-medium">
                                {isRejected 
                                  ? "Thank you for your interest" 
                                  : isHired 
                                  ? "Congratulations! 🎉"
                                  : "Your application is in progress"}
                              </p>
                              <p className="text-sm opacity-90 mt-1">
                                {isRejected 
                                  ? "After careful consideration, we've decided to move forward with other candidates. We encourage you to apply for future opportunities."
                                  : isHired 
                                  ? "You've been selected for this position. Welcome to the team!"
                                  : `Your application is currently at the ${stageLabels[application.current_stage]} stage. We'll be in touch with updates soon.`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Interviews if any */}
                        {application.interviews && application.interviews.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Scheduled Interviews</h4>
                            {application.interviews
                              .filter(i => i.status === "scheduled")
                              .map((interview) => (
                                <div key={interview.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <div>
                                    <span className="capitalize">{interview.interview_type} Interview</span>
                                    <span className="text-muted-foreground ml-2">
                                      on {format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any applications for <strong>{searchedEmail}</strong>.
                    <br />
                    Please check your email address or apply for a position.
                  </p>
                  <Link to="/careers">
                    <Button>
                      View Open Positions <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!searchedEmail && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your email address above to check your application status.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-muted/30 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
