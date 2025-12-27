import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, MapPin, Phone, CreditCard } from "lucide-react";
import { departments, designations } from "@/data/mockData";
import { toast } from "sonner";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Employee added successfully!");
    navigate("/admin/employees");
  };

  const handleNext = () => {
    const tabs = ["personal", "work", "contact", "bank"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs = ["personal", "work", "contact", "bank"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Employees", href: "/admin/employees" },
          { label: "Add Employee" },
        ]}
      />

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
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Smith" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="john.smith@company.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input id="dob" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select>
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
                    <Input id="employeeId" placeholder="EMP011" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input id="joiningDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingTo">Reporting To</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emp-1">John Smith (Engineering Manager)</SelectItem>
                        <SelectItem value="emp-2">Sarah Johnson (HR Manager)</SelectItem>
                        <SelectItem value="emp-5">David Wilson (Finance Manager)</SelectItem>
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
                      <Input id="street" placeholder="123 Main Street" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" placeholder="San Francisco" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" placeholder="California" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input id="zipCode" placeholder="94102" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" placeholder="USA" required />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4">Emergency Contact</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Name *</Label>
                      <Input id="emergencyName" placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelation">Relationship *</Label>
                      <Input id="emergencyRelation" placeholder="Spouse" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Phone *</Label>
                      <Input id="emergencyPhone" placeholder="+1 (555) 987-6543" required />
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
                    <Input id="bankName" placeholder="Chase Bank" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Account Holder Name *</Label>
                    <Input id="accountHolder" placeholder="John Smith" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input id="accountNumber" placeholder="1234567890" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number / IFSC *</Label>
                    <Input id="routingNumber" placeholder="CHASE001" required />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button type="submit">
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
