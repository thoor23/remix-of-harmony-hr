import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  AlertCircle,
  Edit,
  Camera,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useEmployee } from "@/hooks/useEmployees";
import { useCreateProfileChangeRequest, useMyProfileChangeRequests } from "@/hooks/useProfileChangeRequests";
import { format } from "date-fns";

const fieldOptions = [
  { value: "phone", label: "Phone Number" },
  { value: "address_street", label: "Street Address" },
  { value: "address_city", label: "City" },
  { value: "address_state", label: "State" },
  { value: "address_zip_code", label: "Zip Code" },
  { value: "emergency_contact_name", label: "Emergency Contact Name" },
  { value: "emergency_contact_phone", label: "Emergency Contact Phone" },
  { value: "bank_name", label: "Bank Name" },
  { value: "bank_account_number", label: "Bank Account Number" },
  { value: "bank_ifsc_code", label: "Bank IFSC Code" },
];

export default function EmployeeProfile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  
  const { data: currentEmployee, isLoading: currentLoading } = useCurrentEmployee();
  const { data: employee, isLoading: employeeLoading } = useEmployee(currentEmployee?.id || "");
  const { data: changeRequests = [] } = useMyProfileChangeRequests();
  const createRequest = useCreateProfileChangeRequest();

  const handleRequestChange = () => {
    if (!selectedField || !newValue) return;
    
    createRequest.mutate({
      field_name: selectedField,
      current_value: currentValue,
      new_value: newValue,
      reason,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedField("");
        setCurrentValue("");
        setNewValue("");
        setReason("");
      },
    });
  };

  const getFieldCurrentValue = (fieldName: string) => {
    if (!employee) return "";
    const profile = employee.profile;
    
    const fieldMap: Record<string, string> = {
      phone: profile?.phone || "",
      address_street: employee.address_street || "",
      address_city: employee.address_city || "",
      address_state: employee.address_state || "",
      address_zip_code: employee.address_zip_code || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      bank_name: employee.bank_name || "",
      bank_account_number: employee.bank_account_number || "",
      bank_ifsc_code: employee.bank_ifsc_code || "",
    };
    
    return fieldMap[fieldName] || "";
  };

  const handleFieldChange = (value: string) => {
    setSelectedField(value);
    setCurrentValue(getFieldCurrentValue(value));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const isLoading = currentLoading || employeeLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Profile" description="View and manage your profile information" />
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <PageHeader title="My Profile" description="View and manage your profile information" />
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Profile not found. Please contact HR.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const profile = employee.profile;
  const department = employee.department;
  const designation = employee.designation;

  return (
    <PageContainer>
      <PageHeader title="My Profile" description="View and manage your profile information">
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Request Change
        </Button>
      </PageHeader>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile?.first_name?.[0] || ""}{profile?.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-1">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-muted-foreground mb-3">
                {designation?.name || "N/A"} • {department?.name || "N/A"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{employee.employee_id}</Badge>
                <Badge className="bg-success/10 text-success border-success/20 capitalize">{employee.status}</Badge>
                <Badge variant="secondary" className="capitalize">{employee.employment_type}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {employee.date_of_joining}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{employee.address_city || "N/A"}, {employee.address_state || "N/A"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="requests">Change Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">First Name</p>
                  <p className="font-medium">{profile?.first_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                  <p className="font-medium">{profile?.last_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{profile?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{profile?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">{employee.date_of_birth || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                  <p className="font-medium font-mono">{employee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{department?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Designation</p>
                  <p className="font-medium">{designation?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium capitalize">{employee.employment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Joining Date</p>
                  <p className="font-medium">{employee.date_of_joining}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium capitalize">{employee.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Street</p>
                    <p className="font-medium">{employee.address_street || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">City</p>
                      <p className="font-medium">{employee.address_city || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">State</p>
                      <p className="font-medium">{employee.address_state || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Zip Code</p>
                      <p className="font-medium">{employee.address_zip_code || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Country</p>
                      <p className="font-medium">{employee.address_country || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{employee.emergency_contact_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                    <p className="font-medium">{employee.emergency_contact_relationship || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{employee.emergency_contact_phone || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-medium">{employee.bank_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Holder</p>
                  <p className="font-medium">{employee.bank_account_holder_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                  <p className="font-medium font-mono">{employee.bank_account_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IFSC Code</p>
                  <p className="font-medium font-mono">{employee.bank_ifsc_code || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                My Change Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {changeRequests.length > 0 ? (
                <div className="space-y-4">
                  {changeRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="font-medium capitalize">
                            {fieldOptions.find(f => f.value === request.field_name)?.label || request.field_name}
                          </span>
                        </div>
                        <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Value</p>
                          <p>{request.current_value || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requested Value</p>
                          <p>{request.new_value}</p>
                        </div>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground mt-2">Reason: {request.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {format(new Date(request.created_at), "MMM dd, yyyy")}
                      </p>
                      {request.review_comments && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          <span className="font-medium">Review Comments:</span> {request.review_comments}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No change requests submitted</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Change Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Profile Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Submit a request to update your profile information. HR will review and approve your changes.
            </p>
            <div className="space-y-2">
              <Label>Field to Update *</Label>
              <Select value={selectedField} onValueChange={handleFieldChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input value={currentValue} disabled placeholder="Current value" />
            </div>
            <div className="space-y-2">
              <Label>New Value *</Label>
              <Input 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter new value" 
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need this change..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRequestChange}
              disabled={!selectedField || !newValue || createRequest.isPending}
            >
              {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
