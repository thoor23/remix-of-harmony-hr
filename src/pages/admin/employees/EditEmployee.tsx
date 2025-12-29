import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, MapPin, CreditCard, ArrowLeft, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useDepartments, useDesignations, useEmployee, useEmployees, useUpdateEmployee, useUpdateEmployeeAccount, useEmployeeRole } from "@/hooks/useEmployees";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  reportingTo: z.string().optional(),
  primaryStore: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  role: z.string().min(1, "Role is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
  emergencyName: z.string().min(1, "Emergency contact name is required"),
  emergencyRelation: z.string().min(1, "Relationship is required"),
  emergencyPhone: z.string().min(10, "Emergency phone is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().min(1, "Routing number is required"),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0 && data.newPassword.length < 6) {
    return false;
  }
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["newPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormErrors = Partial<Record<keyof z.infer<typeof employeeSchema>, string>>;

export default function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("personal");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    employeeId: "",
    joiningDate: "",
    department: "",
    designation: "",
    employmentType: "",
    reportingTo: "",
    primaryStore: "",
    status: "active",
    role: "employee",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    routingNumber: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: employee, isLoading: employeeLoading } = useEmployee(id || "");
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();
  const { data: employees = [] } = useEmployees();
  const { data: stores = [] } = useStores();
  const { data: employeeRole, isLoading: roleLoading } = useEmployeeRole(employee?.user_id || null);
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeAccount = useUpdateEmployeeAccount();

  // Load employee data into form
  useEffect(() => {
    if (employee) {
      setFormData((prev) => ({
        ...prev,
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        dateOfBirth: employee.date_of_birth || "",
        gender: "",
        employeeId: employee.employee_id,
        joiningDate: employee.date_of_joining,
        department: employee.department?.id || "",
        designation: employee.designation?.id || "",
        employmentType: employee.employment_type,
        reportingTo: employee.reporting_to || "",
        primaryStore: (employee as any).primary_store_id || "",
        status: employee.status || "active",
        street: employee.address_street || "",
        city: employee.address_city || "",
        state: employee.address_state || "",
        zipCode: employee.address_zip_code || "",
        country: employee.address_country || "",
        emergencyName: employee.emergency_contact_name || "",
        emergencyRelation: employee.emergency_contact_relationship || "",
        emergencyPhone: employee.emergency_contact_phone || "",
        bankName: employee.bank_name || "",
        accountHolder: employee.bank_account_holder_name || "",
        accountNumber: employee.bank_account_number || "",
        routingNumber: employee.bank_ifsc_code || "",
      }));
    }
  }, [employee]);

  // Load role when available
  useEffect(() => {
    if (employeeRole) {
      setFormData((prev) => ({
        ...prev,
        role: employeeRole,
      }));
    }
  }, [employeeRole]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const result = employeeSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    
    if (validateForm()) {
      // First update employee table data
      updateEmployee.mutate({
        id,
        data: {
          employee_id: formData.employeeId,
          date_of_birth: formData.dateOfBirth || null,
          date_of_joining: formData.joiningDate,
          department_id: formData.department || null,
          designation_id: formData.designation || null,
          employment_type: formData.employmentType,
          reporting_to: formData.reportingTo || null,
          primary_store_id: formData.primaryStore || null,
          address_street: formData.street || null,
          address_city: formData.city || null,
          address_state: formData.state || null,
          address_zip_code: formData.zipCode || null,
          address_country: formData.country || null,
          emergency_contact_name: formData.emergencyName || null,
          emergency_contact_relationship: formData.emergencyRelation || null,
          emergency_contact_phone: formData.emergencyPhone || null,
          bank_name: formData.bankName || null,
          bank_account_holder_name: formData.accountHolder || null,
          bank_account_number: formData.accountNumber || null,
          bank_ifsc_code: formData.routingNumber || null,
        }
      }, {
        onSuccess: () => {
          // If employee has a user account, update account-related data
          if (employee.user_id) {
            updateEmployeeAccount.mutate({
              employee_id: id,
              user_id: employee.user_id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              role: formData.role as "admin" | "hr" | "manager" | "employee",
              status: formData.status as "active" | "inactive",
              password: formData.newPassword || undefined,
            }, {
              onSuccess: () => {
                navigate("/admin/employees");
              }
            });
          } else {
            navigate("/admin/employees");
          }
        }
      });
    } else {
      toast.error("Please fix the validation errors");
    }
  };

  const handleNext = () => {
    const tabs = ["personal", "work", "contact", "bank", "account"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs = ["personal", "work", "contact", "bank", "account"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const renderError = (field: keyof FormErrors) => {
    if (errors[field]) {
      return <p className="text-sm text-destructive mt-1">{errors[field]}</p>;
    }
    return null;
  };

  // Get managers for reporting to dropdown
  const managers = employees.filter(emp => 
    emp.id !== id && (
      emp.designation?.name?.toLowerCase().includes('manager') || 
      emp.designation?.name?.toLowerCase().includes('director') ||
      emp.designation?.name?.toLowerCase().includes('head')
    )
  );

  const isLoading = employeeLoading || roleLoading;
  const isPending = updateEmployee.isPending || updateEmployeeAccount.isPending;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Employee not found</p>
          <Button onClick={() => navigate("/admin/employees")}>
            Back to Employees
          </Button>
        </div>
      </PageContainer>
    );
  }

  const hasUserAccount = !!employee.user_id;

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/admin/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>

      <PageHeader
        title="Edit Employee"
        description="Update employee information"
      />

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="work" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Work
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <MapPin className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {renderError("firstName")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {renderError("lastName")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {renderError("email")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {renderError("phone")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className={errors.dateOfBirth ? "border-destructive" : ""}
                    />
                    {renderError("dateOfBirth")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={handleNext}>
                    Next: Work Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Information */}
          <TabsContent value="work">
            <Card>
              <CardHeader>
                <CardTitle>Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange("employeeId", e.target.value)}
                      className={errors.employeeId ? "border-destructive" : ""}
                    />
                    {renderError("employeeId")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                      className={errors.joiningDate ? "border-destructive" : ""}
                    />
                    {renderError("joiningDate")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleInputChange("department", value)}
                    >
                      <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderError("department")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) => handleInputChange("designation", value)}
                    >
                      <SelectTrigger className={errors.designation ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map((des) => (
                          <SelectItem key={des.id} value={des.id}>
                            {des.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderError("designation")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange("employmentType", value)}
                    >
                      <SelectTrigger className={errors.employmentType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError("employmentType")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Employee Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError("status")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingTo">Reporting To</Label>
                    <Select
                      value={formData.reportingTo}
                      onValueChange={(value) => handleInputChange("reportingTo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} ({emp.designation?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryStore">Primary Store</Label>
                    <Select
                      value={formData.primaryStore || "none"}
                      onValueChange={(value) => handleInputChange("primaryStore", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary store" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No store assigned</SelectItem>
                        {stores.filter((s: any) => s.is_active).map((store: any) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} ({store.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next: Contact Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Current Address</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange("street", e.target.value)}
                        className={errors.street ? "border-destructive" : ""}
                      />
                      {renderError("street")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {renderError("city")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {renderError("state")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                        className={errors.zipCode ? "border-destructive" : ""}
                      />
                      {renderError("zipCode")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className={errors.country ? "border-destructive" : ""}
                      />
                      {renderError("country")}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4">Emergency Contact</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Name *</Label>
                      <Input
                        id="emergencyName"
                        value={formData.emergencyName}
                        onChange={(e) => handleInputChange("emergencyName", e.target.value)}
                        className={errors.emergencyName ? "border-destructive" : ""}
                      />
                      {renderError("emergencyName")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelation">Relationship *</Label>
                      <Input
                        id="emergencyRelation"
                        value={formData.emergencyRelation}
                        onChange={(e) => handleInputChange("emergencyRelation", e.target.value)}
                        className={errors.emergencyRelation ? "border-destructive" : ""}
                      />
                      {renderError("emergencyRelation")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Phone *</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                        className={errors.emergencyPhone ? "border-destructive" : ""}
                      />
                      {renderError("emergencyPhone")}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next: Bank Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      className={errors.bankName ? "border-destructive" : ""}
                    />
                    {renderError("bankName")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Account Holder Name *</Label>
                    <Input
                      id="accountHolder"
                      value={formData.accountHolder}
                      onChange={(e) => handleInputChange("accountHolder", e.target.value)}
                      className={errors.accountHolder ? "border-destructive" : ""}
                    />
                    {renderError("accountHolder")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      className={errors.accountNumber ? "border-destructive" : ""}
                    />
                    {renderError("accountNumber")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number / IFSC *</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                      className={errors.routingNumber ? "border-destructive" : ""}
                    />
                    {renderError("routingNumber")}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next: Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hasUserAccount && (
                  <Alert>
                    <AlertDescription>
                      This employee does not have a user account. Role and password settings are only available for employees with linked accounts.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                      disabled={!hasUserAccount}
                    >
                      <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError("role")}
                  </div>
                </div>

                {hasUserAccount && (
                  <div>
                    <h3 className="text-sm font-medium mb-4">Change Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Leave blank to keep the current password.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange("newPassword", e.target.value)}
                            className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {renderError("newPassword")}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {renderError("confirmPassword")}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Employee
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </PageContainer>
  );
}
