import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useDesignationsData } from "@/hooks/useDesignations";
import { useUpdateProfile } from "@/hooks/useProfileUpdate";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
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
  const { data: employeeData, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: departments } = useDepartmentsData();
  const { data: designations } = useDesignationsData();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
  });

  // Populate form when data loads or editing starts
  const startEditing = () => {
    if (profile || employeeData) {
      setFormData({
        first_name: profile?.first_name || employeeData?.first_name || "",
        last_name: profile?.last_name || employeeData?.last_name || "",
        phone: profile?.phone || employeeData?.phone || "",
        address_street: employeeData?.address_street || "",
        address_city: employeeData?.address_city || "",
        address_state: employeeData?.address_state || "",
        address_zip_code: employeeData?.address_zip_code || "",
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      address_street: formData.address_street,
      address_city: formData.address_city,
      address_state: formData.address_state,
      address_zip_code: formData.address_zip_code,
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
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || employee?.avatar_url || ""} alt={fullName} />
                <AvatarFallback className="text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-1">{fullName}</h2>
              <p className="text-muted-foreground mb-3">
                {getDesignationName(employee?.designation_id)} • {getDepartmentName(employee?.department_id)}
              </p>
              <div className="flex flex-wrap gap-2">
                {employee?.employee_id && (
                  <Badge variant="outline">{employee.employee_id}</Badge>
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
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee?.phone || profile?.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {employee?.date_of_joining 
                    ? `Joined ${format(new Date(employee.date_of_joining), "MMM yyyy")}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {employee?.address_city && employee?.address_state 
                    ? `${employee.address_city}, ${employee.address_state}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
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
              {isEditing ? (
                <div className="grid gap-6 md:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input value={employee?.date_of_birth || ""} disabled className="bg-muted" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
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
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-medium">{employee?.date_of_birth || "N/A"}</p>
                  </div>
                </div>
              )}
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
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium capitalize">{employee?.status || "N/A"}</p>
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
                        <Input value={employee?.address_country || "India"} disabled className="bg-muted" />
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
