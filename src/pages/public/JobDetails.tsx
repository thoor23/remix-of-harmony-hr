import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Clock, DollarSign, Briefcase, Calendar, Building2, CheckCircle2 } from "lucide-react";
import { useJobOpening, useCreateApplication } from "@/hooks/useRecruitment";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeUpload } from "@/components/recruitment/ResumeUpload";
import { ApplicationSource } from "@/types/recruitment";
import { format } from "date-fns";
import { toast } from "sonner";

const employmentTypeLabels: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  "contract": "Contract",
  "intern": "Internship",
};

const remotePolicyLabels: Record<string, string> = {
  "onsite": "On-site",
  "remote": "Remote",
  "hybrid": "Hybrid",
};

const sources: { value: ApplicationSource; label: string }[] = [
  { value: "website", label: "Company Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "job-portal", label: "Job Portal" },
  { value: "referral", label: "Employee Referral" },
  { value: "other", label: "Other" },
];

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJobOpening(id!);
  const createApplication = useCreateApplication();
  
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    current_company: "",
    current_designation: "",
    experience_years: "",
    expected_salary: "",
    notice_period_days: "",
    source: "website" as ApplicationSource,
    resume_url: "",
    linkedin_url: "",
    cover_letter: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      await createApplication.mutateAsync({
        job_opening_id: id,
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        candidate_phone: form.candidate_phone || undefined,
        current_company: form.current_company || undefined,
        current_designation: form.current_designation || undefined,
        experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
        expected_salary: form.expected_salary ? parseInt(form.expected_salary) : undefined,
        notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : undefined,
        source: form.source,
        resume_url: form.resume_url || undefined,
        linkedin_url: form.linkedin_url || undefined,
        cover_letter: form.cover_letter || undefined,
      });
      
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This position may no longer be available.
            </p>
            <Link to="/careers">
              <Button>View All Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Card className="max-w-lg mx-4">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to <strong>{job.title}</strong>. 
              We've received your application and will review it shortly. 
              You'll receive an email confirmation at <strong>{form.candidate_email}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/careers">
                <Button variant="outline">Browse More Jobs</Button>
              </Link>
              <Link to="/careers/status">
                <Button>Check Application Status</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Building2 className="h-5 w-5" />
            <span className="font-semibold">Careers</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{employmentTypeLabels[job.employment_type] || job.employment_type}</Badge>
                {job.remote_policy && (
                  <Badge variant="outline">{remotePolicyLabels[job.remote_policy]}</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              {job.department?.name && (
                <p className="text-lg text-muted-foreground">{job.department.name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> {job.location}
                </span>
              )}
              {job.show_salary && job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                </span>
              )}
              {job.closing_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Apply by {format(new Date(job.closing_date), "MMM d, yyyy")}
                </span>
              )}
            </div>

            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Apply Now</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={form.candidate_name}
                      onChange={(e) => setForm(prev => ({ ...prev, candidate_name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.candidate_email}
                      onChange={(e) => setForm(prev => ({ ...prev, candidate_email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.candidate_phone}
                      onChange={(e) => setForm(prev => ({ ...prev, candidate_phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label>Resume</Label>
                    <ResumeUpload
                      value={form.resume_url}
                      onChange={(url) => setForm(prev => ({ ...prev, resume_url: url }))}
                      onUploadStart={() => setIsUploading(true)}
                      onUploadEnd={() => setIsUploading(false)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Experience (years)</Label>
                      <Input
                        type="number"
                        value={form.experience_years}
                        onChange={(e) => setForm(prev => ({ ...prev, experience_years: e.target.value }))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Notice (days)</Label>
                      <Input
                        type="number"
                        value={form.notice_period_days}
                        onChange={(e) => setForm(prev => ({ ...prev, notice_period_days: e.target.value }))}
                        placeholder="30"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Current Company</Label>
                    <Input
                      value={form.current_company}
                      onChange={(e) => setForm(prev => ({ ...prev, current_company: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={form.linkedin_url}
                      onChange={(e) => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <Label>How did you hear about us?</Label>
                    <Select
                      value={form.source}
                      onValueChange={(value: ApplicationSource) => setForm(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cover Letter / Message</Label>
                    <Textarea
                      value={form.cover_letter}
                      onChange={(e) => setForm(prev => ({ ...prev, cover_letter: e.target.value }))}
                      placeholder="Tell us why you're interested in this role..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createApplication.isPending || isUploading || !form.candidate_name || !form.candidate_email}
                  >
                    {createApplication.isPending ? "Submitting..." : isUploading ? "Uploading..." : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
