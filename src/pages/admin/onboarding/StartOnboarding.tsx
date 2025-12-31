import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, addDays } from "date-fns";
import { ArrowLeft, UserPlus, Search } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useEmployeeList } from "@/hooks/useEmployees";
import { useOnboardingTemplates, useStartOnboarding } from "@/hooks/useOnboarding";

export default function StartOnboarding() {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<Date>(addDays(new Date(), 30));
  const [notes, setNotes] = useState("");
  const [employeeOpen, setEmployeeOpen] = useState(false);

  const { data: employees } = useEmployeeList();
  const { data: templates } = useOnboardingTemplates();
  const startOnboarding = useStartOnboarding();

  // Filter to show only recent employees without active onboarding
  const recentEmployees = employees?.filter(emp => emp.status === "active") || [];

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      await startOnboarding.mutateAsync({
        employee_id: selectedEmployee.id,
        template_id: templateId || undefined,
        start_date: format(startDate, "yyyy-MM-dd"),
        expected_completion_date: format(expectedCompletionDate, "yyyy-MM-dd"),
        notes: notes || undefined,
      });
      toast.success("Onboarding started successfully");
      navigate("/app/onboarding");
    } catch (error: any) {
      toast.error(error.message || "Failed to start onboarding");
    }
  };

  return (
    <PageContainer
      title="Start Onboarding"
      description="Initiate onboarding process for a new employee"
      actions={
        <Button variant="outline" asChild>
          <Link to="/app/onboarding">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      }
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>New Onboarding</CardTitle>
            <CardDescription>
              Select an employee and configure their onboarding process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label>Select Employee *</Label>
              <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                  >
                    {selectedEmployee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedEmployee.avatar_url || ""} />
                          <AvatarFallback>
                            {selectedEmployee.first_name?.[0]}
                            {selectedEmployee.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </span>
                        <span className="text-muted-foreground">
                          ({selectedEmployee.employee_id})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        <Search className="h-4 w-4 mr-2 inline" />
                        Search employees...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or ID..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {recentEmployees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => {
                              setSelectedEmployee(emp);
                              setEmployeeOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={emp.avatar_url || ""} />
                                <AvatarFallback>
                                  {emp.first_name?.[0]}
                                  {emp.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {emp.first_name} {emp.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {emp.employee_id} • {emp.department?.name || "No Department"}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Employee Card */}
            {selectedEmployee && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedEmployee.avatar_url || ""} />
                      <AvatarFallback>
                        {selectedEmployee.first_name?.[0]}
                        {selectedEmployee.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmployee.designation?.name || "No Designation"} •{" "}
                        {selectedEmployee.department?.name || "No Department"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Joined: {format(new Date(selectedEmployee.date_of_joining), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Onboarding Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Templates provide pre-defined tasks. Leave empty to create custom tasks later.
              </p>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <DatePicker
                  date={startDate}
                  onDateChange={(date) => date && setStartDate(date)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Completion Date</Label>
                <DatePicker
                  date={expectedCompletionDate}
                  onDateChange={(date) => date && setExpectedCompletionDate(date)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/app/onboarding">Cancel</Link>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedEmployee || startOnboarding.isPending}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Start Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
