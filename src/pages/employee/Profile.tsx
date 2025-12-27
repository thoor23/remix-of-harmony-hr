import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { employees } from "@/data/mockData";
import { toast } from "sonner";

export default function EmployeeProfile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const employee = employees.find((e) => e.id === "emp-3")!; // Current logged in employee

  const handleRequestChange = () => {
    toast.success("Profile change request submitted successfully!");
    setIsEditDialogOpen(false);
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "My Profile" }]} />

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
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="text-2xl">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-1">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-muted-foreground mb-3">
                {employee.designation.name} • {employee.department.name}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{employee.employeeId}</Badge>
                <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                <Badge variant="secondary">{employee.employmentType}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {employee.dateOfJoining}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{employee.address.city}, {employee.address.state}</span>
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
                  <p className="font-medium">{employee.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                  <p className="font-medium">{employee.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">{employee.dateOfBirth}</p>
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
                  <p className="font-medium font-mono">{employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{employee.department.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Designation</p>
                  <p className="font-medium">{employee.designation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium capitalize">{employee.employmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Joining Date</p>
                  <p className="font-medium">{employee.dateOfJoining}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reporting To</p>
                  <p className="font-medium">John Smith</p>
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
                    <p className="font-medium">{employee.address.street}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">City</p>
                      <p className="font-medium">{employee.address.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">State</p>
                      <p className="font-medium">{employee.address.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Zip Code</p>
                      <p className="font-medium">{employee.address.zipCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Country</p>
                      <p className="font-medium">{employee.address.country}</p>
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
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                    <p className="font-medium">{employee.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{employee.emergencyContact.phone}</p>
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
                  <p className="font-medium">{employee.bankDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Holder</p>
                  <p className="font-medium">{employee.bankDetails.accountHolderName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                  <p className="font-medium font-mono">{employee.bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IFSC Code</p>
                  <p className="font-medium font-mono">{employee.bankDetails.ifscCode}</p>
                </div>
              </div>
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
              <Label>Field to Update</Label>
              <Input placeholder="e.g., Phone Number, Address" />
            </div>
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input placeholder="Current value" />
            </div>
            <div className="space-y-2">
              <Label>New Value</Label>
              <Input placeholder="New value you want" />
            </div>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea placeholder="Explain why you need this change..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestChange}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
