import { useState, useRef } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Building2,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useEmployee } from "@/hooks/useEmployees";
import { useCreateProfileChangeRequest, useMyProfileChangeRequests } from "@/hooks/useProfileChangeRequests";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: currentEmployee, isLoading: currentLoading, refetch: refetchCurrentEmployee } = useCurrentEmployee();
  const { data: employee, isLoading: employeeLoading, refetch: refetchEmployee } = useEmployee(currentEmployee?.id || "");
  const { data: changeRequests = [] } = useMyProfileChangeRequests();
  const createRequest = useCreateProfileChangeRequest();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${employee.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      const token = localStorage.getItem("access_token");
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-employees/current`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      refetchEmployee();
      refetchCurrentEmployee();
      
      toast.success("Profile photo updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    
    const fieldMap: Record<string, string> = {
      phone: employee.phone || "",
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
              <Skeleton className="h-28 w-28 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <Card className="mb-6 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {employee.first_name?.[0] || ""}{employee.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-muted-foreground mb-3">
                {designation?.name || "N/A"} • {department?.name || "N/A"}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="font-mono">{employee.employee_id}</Badge>
                <Badge className="bg-success/10 text-success border-success/20 capitalize">{employee.status}</Badge>
                <Badge variant="secondary" className="capitalize">{employee.employment_type}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {employee.date_of_joining}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{employee.address_city || "N/A"}, {employee.address_state || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid */}
      <div className="space-y-6">
        {/* Personal & Work Info Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">First Name</p>
                  <p className="font-medium">{employee.first_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                  <p className="font-medium">{employee.last_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{employee.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{employee.phone || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">{employee.date_of_birth || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        {/* Address & Emergency Contact Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Address */}
          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-500" />
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

          {/* Emergency Contact */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-orange-500" />
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

        {/* Bank Details */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Change Requests */}
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5 text-yellow-500" />
              My Change Requests
              {changeRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">{changeRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {changeRequests.length > 0 ? (
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">
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
                        <p className="font-medium">{request.current_value || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Requested Value</p>
                        <p className="font-medium">{request.new_value}</p>
                      </div>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-3">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted: {format(new Date(request.created_at), "MMM dd, yyyy")}
                    </p>
                    {request.review_comments && (
                      <div className="text-sm mt-3 p-3 bg-muted rounded-md">
                        <span className="font-medium">Review Comments:</span> {request.review_comments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Edit className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No change requests submitted</p>
                <p className="text-sm mt-1">Click "Request Change" to update your profile information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
