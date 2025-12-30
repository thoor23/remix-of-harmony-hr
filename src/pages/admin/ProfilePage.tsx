import { useState, useRef } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useDesignationsData } from "@/hooks/useDesignations";
import { useUpdateProfile } from "@/hooks/useProfileUpdate";
import { supabase } from "@/integrations/supabase/client";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon,
  ChevronDown,
  Shield,
  Camera,
  Loader2,
  Briefcase,
  CreditCard,
  AlertCircle,
  Edit,
  Save,
} from "lucide-react";

export default function AdminProfilePage() {
  const { user, profile, role } = useAuth();
  const { data: employeeData, isLoading: employeeLoading, refetch } = useCurrentEmployee();
  const { data: departments } = useDepartmentsData();
  const { data: designations } = useDesignationsData();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
    address_country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    bank_name: "",
    bank_account_holder_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${employeeData?.id || user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-assets")
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      await refetch();
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startEditing = () => {
    if (profile || employeeData) {
      setFormData({
        first_name: profile?.first_name || employeeData?.first_name || "",
        last_name: profile?.last_name || employeeData?.last_name || "",
        phone: profile?.phone || employeeData?.phone || "",
        date_of_birth: employeeData?.date_of_birth || "",
        address_street: employeeData?.address_street || "",
        address_city: employeeData?.address_city || "",
        address_state: employeeData?.address_state || "",
        address_zip_code: employeeData?.address_zip_code || "",
        address_country: employeeData?.address_country || "",
        emergency_contact_name: employeeData?.emergency_contact_name || "",
        emergency_contact_phone: employeeData?.emergency_contact_phone || "",
        emergency_contact_relationship: employeeData?.emergency_contact_relationship || "",
        bank_name: employeeData?.bank_name || "",
        bank_account_holder_name: employeeData?.bank_account_holder_name || "",
        bank_account_number: employeeData?.bank_account_number || "",
        bank_ifsc_code: employeeData?.bank_ifsc_code || "",
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth,
      address_street: formData.address_street,
      address_city: formData.address_city,
      address_state: formData.address_state,
      address_zip_code: formData.address_zip_code,
      address_country: formData.address_country,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      emergency_contact_relationship: formData.emergency_contact_relationship,
      bank_name: formData.bank_name,
      bank_account_holder_name: formData.bank_account_holder_name,
      bank_account_number: formData.bank_account_number,
      bank_ifsc_code: formData.bank_ifsc_code,
    });
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId || !departments) return "Not assigned";
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "Unknown";
  };

  const getDesignationName = (desigId: string | null) => {
    if (!desigId || !designations) return "Not assigned";
    const desig = designations.find(d => d.id === desigId);
    return desig?.name || "Unknown";
  };

  const getRoleBadgeLabel = () => {
    switch (role) {
      case "admin": return "Administrator";
      case "hr": return "HR Manager";
      case "manager": return "Manager";
      default: return "Employee";
    }
  };

  const employee = employeeData;
  const department = employee?.department;
  const designation = employee?.designation;

  const fullName = profile 
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
    : employeeData 
      ? `${employeeData.first_name || ""} ${employeeData.last_name || ""}`.trim()
      : user?.email || "User";

  const initials = fullName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "U";

  if (employeeLoading) {
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

  return (
    <PageContainer>
      <PageHeader title="My Profile" description="View and manage your profile information">
        {!isEditing ? (
          <Button onClick={startEditing}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Profile Header */}
      <Card className="mb-6 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url || employee?.avatar_url || ""} alt={fullName} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {initials}
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
              <h2 className="text-2xl font-bold mb-1">{fullName}</h2>
              <p className="text-muted-foreground mb-3">
                {designation?.name || getDesignationName(employee?.designation_id)} • {department?.name || getDepartmentName(employee?.department_id)}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {employee?.employee_id && (
                  <Badge variant="outline" className="font-mono">{employee.employee_id}</Badge>
                )}
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleBadgeLabel()}
                </Badge>
                {employee?.status && (
                  <Badge className="bg-success/10 text-success border-success/20 capitalize">{employee.status}</Badge>
                )}
                {employee?.employment_type && (
                  <Badge variant="secondary" className="capitalize">{employee.employment_type}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{employee?.phone || profile?.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {employee?.date_of_joining 
                      ? `Joined ${format(new Date(employee.date_of_joining), "MMM yyyy")}`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {employee?.address_city && employee?.address_state 
                      ? `${employee.address_city}, ${employee.address_state}`
                      : "N/A"}
                  </span>
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
              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input 
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input 
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal",
                            !formData.date_of_birth && "text-muted-foreground"
                          )}
                        >
                          {formData.date_of_birth 
                            ? format(parse(formData.date_of_birth, "yyyy-MM-dd", new Date()), "dd MMM yyyy")
                            : "Select date"
                          }
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date_of_birth ? parse(formData.date_of_birth, "yyyy-MM-dd", new Date()) : undefined}
                          onSelect={(date) => setFormData({ ...formData, date_of_birth: date ? format(date, "yyyy-MM-dd") : "" })}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">First Name</p>
                    <p className="font-medium">{employee?.first_name || profile?.first_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                    <p className="font-medium">{employee?.last_name || profile?.last_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{employee?.phone || profile?.phone || "N/A"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-medium">{employee?.date_of_birth || "N/A"}</p>
                  </div>
                </div>
              )}
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
                  <p className="font-medium font-mono">{employee?.employee_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{department?.name || getDepartmentName(employee?.department_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Designation</p>
                  <p className="font-medium">{designation?.name || getDesignationName(employee?.designation_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Role</p>
                  <p className="font-medium">{getRoleBadgeLabel()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium capitalize">{employee?.employment_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Joining Date</p>
                  <p className="font-medium">{employee?.date_of_joining || "N/A"}</p>
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
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Textarea 
                      value={formData.address_street}
                      onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input 
                        value={formData.address_city}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input 
                        value={formData.address_state}
                        onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input 
                        value={formData.address_zip_code}
                        onChange={(e) => setFormData({ ...formData, address_zip_code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input 
                        value={formData.address_country}
                        onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Street</p>
                    <p className="font-medium">{employee?.address_street || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">City</p>
                      <p className="font-medium">{employee?.address_city || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">State</p>
                      <p className="font-medium">{employee?.address_state || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Zip Code</p>
                      <p className="font-medium">{employee?.address_zip_code || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Country</p>
                      <p className="font-medium">{employee?.address_country || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
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
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Input 
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{employee?.emergency_contact_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                    <p className="font-medium">{employee?.emergency_contact_relationship || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{employee?.emergency_contact_phone || "N/A"}</p>
                  </div>
                </div>
              )}
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
            {isEditing ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input 
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder</Label>
                  <Input 
                    value={formData.bank_account_holder_name}
                    onChange={(e) => setFormData({ ...formData, bank_account_holder_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input 
                    value={formData.bank_ifsc_code}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc_code: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-medium">{employee?.bank_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Holder</p>
                  <p className="font-medium">{employee?.bank_account_holder_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                  <p className="font-medium font-mono">{employee?.bank_account_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IFSC Code</p>
                  <p className="font-medium font-mono">{employee?.bank_ifsc_code || "N/A"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
