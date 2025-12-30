import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useDesignationsData } from "@/hooks/useDesignations";
import { useUpdateProfile } from "@/hooks/useProfileUpdate";
import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function AdminProfilePage() {
  const { user, profile, role } = useAuth();
  const { data: employeeData, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: departments } = useDepartmentsData();
  const { data: designations } = useDesignationsData();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip_code: "",
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile || employeeData) {
      setFormData({
        first_name: profile?.first_name || employeeData?.first_name || "",
        last_name: profile?.last_name || employeeData?.last_name || "",
        email: profile?.email || employeeData?.email || user?.email || "",
        phone: profile?.phone || employeeData?.phone || "",
        address_street: employeeData?.address_street || "",
        address_city: employeeData?.address_city || "",
        address_state: employeeData?.address_state || "",
        address_zip_code: employeeData?.address_zip_code || "",
      });
    }
  }, [profile, employeeData, user]);

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
        <PageHeader
          title="My Profile"
          description="View and manage your profile information"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Profile"
        description="View and manage your profile information"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || employeeData?.avatar_url || ""} alt={fullName} />
                  <AvatarFallback className="text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{fullName}</h3>
              <p className="text-muted-foreground capitalize">
                {getDesignationName(employeeData?.designation_id)}
              </p>
              <Badge className="mt-2" variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                {getRoleBadgeLabel()}
              </Badge>
              
              <Separator className="my-4" />
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{user?.email || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employeeData?.phone || profile?.phone || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{getDepartmentName(employeeData?.department_id)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {employeeData?.address_city && employeeData?.address_state 
                      ? `${employeeData.address_city}, ${employeeData.address_state}`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {employeeData?.date_of_joining 
                      ? `Joined ${format(new Date(employeeData.date_of_joining), "MMM yyyy")}`
                      : "Join date not set"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    value={getDepartmentName(employeeData?.department_id)} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input 
                    value={getDesignationName(employeeData?.designation_id)} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />
              
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h4>
              
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Textarea 
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  rows={2}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input 
                    value={formData.address_state}
                    onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input 
                    value={formData.address_zip_code}
                    onChange={(e) => setFormData({ ...formData, address_zip_code: e.target.value })}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  // Reset form
                  if (profile || employeeData) {
                    setFormData({
                      first_name: profile?.first_name || employeeData?.first_name || "",
                      last_name: profile?.last_name || employeeData?.last_name || "",
                      email: profile?.email || employeeData?.email || user?.email || "",
                      phone: profile?.phone || employeeData?.phone || "",
                      address_street: employeeData?.address_street || "",
                      address_city: employeeData?.address_city || "",
                      address_state: employeeData?.address_state || "",
                      address_zip_code: employeeData?.address_zip_code || "",
                    });
                  }
                }}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
