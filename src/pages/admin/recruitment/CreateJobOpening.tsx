import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateJobOpening } from "@/hooks/useRecruitment";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useDesignationsData } from "@/hooks/useDesignations";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { EmploymentType, RemotePolicy } from "@/types/recruitment";

export default function CreateJobOpening() {
  const navigate = useNavigate();
  const createJob = useCreateJobOpening();
  const { data: departments } = useDepartmentsData();
  const { data: designations } = useDesignationsData();

  const [form, setForm] = useState<{
    title: string;
    description: string;
    requirements: string;
    department_id: string;
    designation_id: string;
    employment_type: EmploymentType;
    location: string;
    remote_policy: RemotePolicy;
    openings_count: number;
    salary_min: string;
    salary_max: string;
    show_salary: boolean;
    closing_date: string;
  }>({
    title: "",
    description: "",
    requirements: "",
    department_id: "",
    designation_id: "",
    employment_type: "full-time",
    location: "",
    remote_policy: "onsite",
    openings_count: 1,
    salary_min: "",
    salary_max: "",
    show_salary: false,
    closing_date: "",
  });

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    await createJob.mutateAsync({
      title: form.title,
      description: form.description,
      requirements: form.requirements,
      employment_type: form.employment_type,
      location: form.location,
      remote_policy: form.remote_policy,
      openings_count: form.openings_count,
      show_salary: form.show_salary,
      salary_min: form.salary_min ? parseFloat(form.salary_min) : undefined,
      salary_max: form.salary_max ? parseFloat(form.salary_max) : undefined,
      department_id: form.department_id || undefined,
      designation_id: form.designation_id || undefined,
      closing_date: form.closing_date || undefined,
    });
    navigate("/app/recruitment/jobs");
  };

  return (
    <PageContainer>
      <PageHeader title="Post New Job" description="Create a new job opening" />
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Job Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Requirements</Label><Textarea rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Compensation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Minimum Salary</Label><Input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} /></div>
                  <div><Label>Maximum Salary</Label><Input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.show_salary} onCheckedChange={(v) => setForm({ ...form, show_salary: v })} /><Label>Show salary on job posting</Label></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Department</Label><Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Designation</Label><Select value={form.designation_id} onValueChange={(v) => setForm({ ...form, designation_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{designations?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Employment Type</Label><Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v as EmploymentType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full-time">Full Time</SelectItem><SelectItem value="part-time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="intern">Intern</SelectItem></SelectContent></Select></div>
                <div><Label>Openings</Label><Input type="number" min={1} value={form.openings_count} onChange={(e) => setForm({ ...form, openings_count: parseInt(e.target.value) || 1 })} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Location</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Work Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" /></div>
                <div><Label>Remote Policy</Label><Select value={form.remote_policy} onValueChange={(v) => setForm({ ...form, remote_policy: v as RemotePolicy })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="onsite">Onsite</SelectItem><SelectItem value="remote">Remote</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select></div>
                <div><Label>Closing Date</Label><Input type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} /></div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={createJob.isPending}>Save as Draft</Button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
