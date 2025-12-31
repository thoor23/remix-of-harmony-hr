import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useOffboardingProcess, useSaveExitInterview } from "@/hooks/useOffboarding";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ExitInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutateAsync: saveInterview, isPending: isSavingInterview } = useSaveExitInterview();
  const { data: process } = useOffboardingProcess(id!);

  const [formData, setFormData] = useState({
    reason_for_leaving: "",
    overall_rating: 3,
    would_rejoin: false,
    would_recommend: false,
    feedback: {
      work_environment: "",
      management: "",
      growth_opportunities: "",
      compensation: "",
      work_life_balance: "",
    },
    suggestions: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveInterview({
        offboardingId: id!,
        ...formData,
        interview_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      toast.success("Exit interview saved successfully");
      navigate(`/app/offboarding/${id}`);
    } catch (error) {
      toast.error("Failed to save exit interview");
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Exit Interview"
        description={process ? `${process.employee?.first_name} ${process.employee?.last_name}` : 'Loading...'}
      >
        <Button variant="outline" onClick={() => navigate(`/app/offboarding/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Reason for Leaving</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary reason for leaving the organization</Label>
                <RadioGroup
                  value={formData.reason_for_leaving}
                  onValueChange={(value) => setFormData({ ...formData, reason_for_leaving: value })}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="better_opportunity" id="r1" />
                    <Label htmlFor="r1">Better Career Opportunity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="higher_salary" id="r2" />
                    <Label htmlFor="r2">Higher Salary/Benefits</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="work_life_balance" id="r3" />
                    <Label htmlFor="r3">Work-Life Balance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relocation" id="r4" />
                    <Label htmlFor="r4">Relocation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="management_issues" id="r5" />
                    <Label htmlFor="r5">Management Issues</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal_reasons" id="r6" />
                    <Label htmlFor="r6">Personal Reasons</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="r7" />
                    <Label htmlFor="r7">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Experience Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>How would you rate your overall experience? (1-5)</Label>
                <div className="mt-4 space-y-2">
                  <Slider
                    value={[formData.overall_rating]}
                    onValueChange={(value) => setFormData({ ...formData, overall_rating: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Poor</span>
                    <span className="font-medium text-foreground">{formData.overall_rating}/5</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Would you consider rejoining in the future?</Label>
                <Switch
                  checked={formData.would_rejoin}
                  onCheckedChange={(checked) => setFormData({ ...formData, would_rejoin: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Would you recommend this company to others?</Label>
                <Switch
                  checked={formData.would_recommend}
                  onCheckedChange={(checked) => setFormData({ ...formData, would_recommend: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Feedback */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Work Environment</Label>
                  <Textarea
                    value={formData.feedback.work_environment}
                    onChange={(e) => setFormData({
                      ...formData,
                      feedback: { ...formData.feedback, work_environment: e.target.value }
                    })}
                    placeholder="Share your thoughts about the work environment..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Management & Leadership</Label>
                  <Textarea
                    value={formData.feedback.management}
                    onChange={(e) => setFormData({
                      ...formData,
                      feedback: { ...formData.feedback, management: e.target.value }
                    })}
                    placeholder="Feedback on management and leadership..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Growth Opportunities</Label>
                  <Textarea
                    value={formData.feedback.growth_opportunities}
                    onChange={(e) => setFormData({
                      ...formData,
                      feedback: { ...formData.feedback, growth_opportunities: e.target.value }
                    })}
                    placeholder="Your experience with career growth..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Compensation & Benefits</Label>
                  <Textarea
                    value={formData.feedback.compensation}
                    onChange={(e) => setFormData({
                      ...formData,
                      feedback: { ...formData.feedback, compensation: e.target.value }
                    })}
                    placeholder="Thoughts on salary and benefits..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Suggestions for Improvement</Label>
                <Textarea
                  value={formData.suggestions}
                  onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                  placeholder="Any suggestions to improve the organization..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(`/app/offboarding/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSavingInterview}>
            {isSavingInterview ? "Saving..." : "Save Interview"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
