import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useDepartments, useDesignations, useEmployees } from "@/hooks/useEmployees";
import { useCreateEmployeeAccount } from "@/hooks/useCreateEmployeeAccount";
import { z } from "zod";

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
  status: z.string().min(1, "Status is required"),
  role: z.enum(["admin", "hr", "manager", "employee"]),
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
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormErrors = Partial<Record<keyof z.infer<typeof employeeSchema>, string>>;

export default function AddEmployee() {
  const navigate = useNavigate();
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
    status: "active",
    role: "employee" as "admin" | "hr" | "manager" | "employee",
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
    password: "",
    confirmPassword: "",
  });

  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();
  const { data: employees = [] } = useEmployees();
  const createEmployeeAccount = useCreateEmployeeAccount();

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
    if (validateForm()) {
      createEmployeeAccount.mutate({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        employee_data: {
          employee_id: formData.employeeId,
          date_of_birth: formData.dateOfBirth || undefined,
          date_of_joining: formData.joiningDate,
          department_id: formData.department || undefined,
          designation_id: formData.designation || undefined,
          employment_type: formData.employmentType,
          status: formData.status,
          reporting_to: formData.reportingTo || undefined,
          address_street: formData.street || undefined,
          address_city: formData.city || undefined,
          address_state: formData.state || undefined,
          address_zip_code: formData.zipCode || undefined,
          address_country: formData.country || undefined,
          emergency_contact_name: formData.emergencyName || undefined,
          emergency_contact_relationship: formData.emergencyRelation || undefined,
          emergency_contact_phone: formData.emergencyPhone || undefined,
          bank_name: formData.bankName || undefined,
          bank_account_holder_name: formData.accountHolder || undefined,
          bank_account_number: formData.accountNumber || undefined,
          bank_ifsc_code: formData.routingNumber || undefined,
        },
      }, {
        onSuccess: () => {
          navigate("/admin/employees");
        }
      });
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
    emp.designation?.name?.toLowerCase().includes('manager') || 
    emp.designation?.name?.toLowerCase().includes('director') ||
    emp.designation?.name?.toLowerCase().includes('head')
  );

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/admin/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>

      <PageHeader
        title="Add New Employee"
        description="Fill in the details to create a new employee record"
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
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

                <div>
                  <h3 className="text-sm font-medium mb-4">Set Password</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
                          placeholder="Enter password"
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
                      {renderError("password")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                          placeholder="Confirm password"
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

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={createEmployeeAccount.isPending}>
                    {createEmployeeAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Employee
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
