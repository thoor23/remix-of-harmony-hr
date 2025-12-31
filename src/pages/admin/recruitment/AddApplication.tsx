import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useJobOpenings, useCreateApplication } from "@/hooks/useRecruitment";
import { ApplicationSource } from "@/types/recruitment";
import { ResumeUpload } from "@/components/recruitment/ResumeUpload";

const sources: { value: ApplicationSource; label: string }[] = [
  { value: "job-portal", label: "Job Portal" },
  { value: "referral", label: "Employee Referral" },
  { value: "website", label: "Company Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Other" },
];

export default function AddApplication() {
  const navigate = useNavigate();
  const { data: jobs } = useJobOpenings({ status: "open" });
  const createApplication = useCreateApplication();
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    job_opening_id: "",
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
    portfolio_url: "",
    cover_letter: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createApplication.mutateAsync({
      job_opening_id: form.job_opening_id,
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
      portfolio_url: form.portfolio_url || undefined,
      cover_letter: form.cover_letter || undefined,
    });

    navigate("/app/recruitment/applications");
  };

  return (
    <PageContainer>
      <PageHeader title="Add Application" description="Manually add a new candidate application">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Candidate Information</h3>
              
              <div>
                <Label>Job Opening *</Label>
                <Select
                  value={form.job_opening_id}
                  onValueChange={(value) => setForm(prev => ({ ...prev, job_opening_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job opening" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs?.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} {job.department?.name && `(${job.department.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Candidate Name *</Label>
                <Input
                  value={form.candidate_name}
                  onChange={(e) => setForm(prev => ({ ...prev, candidate_name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.candidate_email}
                  onChange={(e) => setForm(prev => ({ ...prev, candidate_email: e.target.value }))}
                  placeholder="email@example.com"
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
                <Label>Source</Label>
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
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Experience & Expectations</h3>

              <div>
                <Label>Current Company</Label>
                <Input
                  value={form.current_company}
                  onChange={(e) => setForm(prev => ({ ...prev, current_company: e.target.value }))}
                  placeholder="Company name"
                />
              </div>

              <div>
                <Label>Current Designation</Label>
                <Input
                  value={form.current_designation}
                  onChange={(e) => setForm(prev => ({ ...prev, current_designation: e.target.value }))}
                  placeholder="Job title"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <Label>Expected Salary</Label>
                  <Input
                    type="number"
                    value={form.expected_salary}
                    onChange={(e) => setForm(prev => ({ ...prev, expected_salary: e.target.value }))}
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
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links & Resume Upload */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Resume & Documents</h3>

              <ResumeUpload
                value={form.resume_url}
                onChange={(url) => setForm(prev => ({ ...prev, resume_url: url }))}
                onUploadStart={() => setIsUploading(true)}
                onUploadEnd={() => setIsUploading(false)}
              />

              <div>
                <Label>LinkedIn URL</Label>
                <Input
                  value={form.linkedin_url}
                  onChange={(e) => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <Label>Portfolio URL</Label>
                <Input
                  value={form.portfolio_url}
                  onChange={(e) => setForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Cover Letter</h3>
              <Textarea
                value={form.cover_letter}
                onChange={(e) => setForm(prev => ({ ...prev, cover_letter: e.target.value }))}
                placeholder="Enter cover letter or notes about the candidate..."
                rows={8}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createApplication.isPending || isUploading || !form.job_opening_id || !form.candidate_name || !form.candidate_email}
          >
            {createApplication.isPending ? "Creating..." : isUploading ? "Uploading..." : "Add Application"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
