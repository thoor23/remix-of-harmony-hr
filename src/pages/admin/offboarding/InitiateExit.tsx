import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInitiateOffboarding } from "@/hooks/useOffboarding";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft } from "lucide-react";

export default function InitiateExit() {
  const navigate = useNavigate();
  const { mutateAsync: createProcess, isPending: isCreating } = useInitiateOffboarding();
  const { data: employees, isLoading: employeesLoading } = useEmployees();

  const [formData, setFormData] = useState({
    employee_id: "",
    exit_type: "resignation",
    resignation_date: new Date(),
    notice_period_days: 30,
    exit_reason: "",
    handover_to: "",
    notes: "",
  });

  const activeEmployees = employees?.filter(e => e.status === 'active') || [];
  const lastWorkingDay = addDays(formData.resignation_date, formData.notice_period_days);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast.error("Please select an employee");
      return;
    }

    try {
      await createProcess({
        ...formData,
        resignation_date: format(formData.resignation_date, 'yyyy-MM-dd'),
        last_working_day: format(lastWorkingDay, 'yyyy-MM-dd'),
        status: 'initiated',
      });
      toast.success("Offboarding process initiated");
      navigate('/app/offboarding');
    } catch (error) {
      toast.error("Failed to initiate offboarding");
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Initiate Exit" description="Start the offboarding process for an employee">
        <Button variant="outline" onClick={() => navigate('/app/offboarding')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Employee *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Exit Type *</Label>
                <Select
                  value={formData.exit_type}
                  onValueChange={(value) => setFormData({ ...formData, exit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="layoff">Layoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason for Exit</Label>
                <Textarea
                  value={formData.exit_reason}
                  onChange={(e) => setFormData({ ...formData, exit_reason: e.target.value })}
                  placeholder="Enter reason for leaving..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates & Notice Period */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Resignation/Exit Date *</Label>
                <DatePicker
                  date={formData.resignation_date}
                  setDate={(date) => date && setFormData({ ...formData, resignation_date: date })}
                />
              </div>

              <div>
                <Label>Notice Period (Days)</Label>
                <Input
                  type="number"
                  value={formData.notice_period_days}
                  onChange={(e) => setFormData({ ...formData, notice_period_days: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={180}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Last Working Day</div>
                <div className="text-lg font-semibold">
                  {format(lastWorkingDay, 'dd MMMM yyyy')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.notice_period_days} days from resignation date
                </div>
              </div>

              <div>
                <Label>Handover To</Label>
                <Select
                  value={formData.handover_to}
                  onValueChange={(value) => setFormData({ ...formData, handover_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee for handover" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees
                      .filter(e => e.id !== formData.employee_id)
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/app/offboarding')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Initiating..." : "Initiate Exit"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
