import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Building2, MapPin, Phone, Mail, Clock, Users, Edit, UserPlus, 
  Trash2, ArrowLeft, Globe, Calendar, DollarSign
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  useLocation as useLocationData, 
  useLocationEmployees, 
  useAssignEmployeeToLocation,
  useRemoveEmployeeFromLocation,
  LocationAssignment 
} from "@/hooks/useLocations";
import { useEmployees } from "@/hooks/useEmployees";

export default function StoreDetails() {
  const { id } = useParams<{ id: string }>();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [removeEmployee, setRemoveEmployee] = useState<LocationAssignment | null>(null);

  const { data: store, isLoading } = useLocationData(id || "");
  const { data: storeEmployees, isLoading: loadingEmployees } = useLocationEmployees(id || "");
  const { data: allEmployees } = useEmployees();
  const assignEmployee = useAssignEmployeeToLocation();
  const removeEmployeeMutation = useRemoveEmployeeFromLocation();

  const availableEmployees = allEmployees?.filter(
    (emp: any) => emp.status === 'active' && !storeEmployees?.some(
      (sa) => sa.employee_id === emp.id
    )
  ) || [];

  const handleAssign = async () => {
    if (!id || !selectedEmployee) return;
    await assignEmployee.mutateAsync({
      locationId: id,
      employee_id: selectedEmployee,
      is_primary: isPrimary,
    });
    setShowAssignDialog(false);
    setSelectedEmployee("");
    setIsPrimary(false);
  };

  const handleRemove = async () => {
    if (!id || !removeEmployee) return;
    await removeEmployeeMutation.mutateAsync({
      locationId: id,
      employeeId: removeEmployee.employee_id,
    });
    setRemoveEmployee(null);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Store Details" description="Loading...">
          <Button variant="outline" asChild>
            <Link to="/admin/locations/stores">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </PageHeader>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (!store) {
    return (
      <PageContainer>
        <PageHeader title="Store Not Found" description="The requested store could not be found">
          <Button asChild>
            <Link to="/admin/locations/stores">Back to Stores</Link>
          </Button>
        </PageHeader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={store.name} description={`Store Code: ${store.code}`}>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/locations/stores">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/admin/locations/stores/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Store
            </Link>
          </Button>
        </div>
      </PageHeader>
      <div className="space-y-6">
        {/* Store Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <Badge variant={store.is_active ? "default" : "secondary"}>
                  {store.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {store.address_street && <>{store.address_street}<br /></>}
                    {[store.address_city, store.address_state, store.address_zip_code]
                      .filter(Boolean).join(", ")}
                    {store.address_country && <><br />{store.address_country}</>}
                    {!store.address_street && !store.address_city && "Not specified"}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{store.phone || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{store.email || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Operating Hours</p>
                  <p className="text-muted-foreground">
                    {store.opening_time && store.closing_time 
                      ? `${store.opening_time} - ${store.closing_time}`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Timezone</p>
                    <p className="text-muted-foreground text-sm">{store.timezone || "Asia/Kolkata"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date Format</p>
                    <p className="text-muted-foreground text-sm">{store.date_format || "DD/MM/YYYY"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Currency</p>
                    <p className="text-muted-foreground text-sm">{store.currency || "INR"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager Card */}
          <Card>
            <CardHeader>
              <CardTitle>Store Manager</CardTitle>
            </CardHeader>
            <CardContent>
              {store.manager ? (
                <div className="space-y-2">
                  <p className="font-medium text-lg">
                    {store.manager.first_name} {store.manager.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {store.manager.employee_id}
                  </p>
                  {store.manager.email && (
                    <p className="text-sm text-muted-foreground">{store.manager.email}</p>
                  )}
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link to={`/admin/employees/${store.manager.id}`}>View Profile</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No manager assigned</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link to={`/admin/locations/stores/${id}/edit`}>Assign Manager</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employees Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Employees ({storeEmployees?.length || 0})
              </CardTitle>
              <Button size="sm" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingEmployees ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : storeEmployees?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No employees assigned to this store</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Since</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeEmployees?.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {assignment.employee?.first_name} {assignment.employee?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {assignment.employee?.employee_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.employee?.department?.name || "—"}</TableCell>
                        <TableCell>{assignment.employee?.designation?.name || "—"}</TableCell>
                        <TableCell>
                          {assignment.is_primary && (
                            <Badge variant="secondary">Primary</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(assignment.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveEmployee(assignment)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Employee Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee to Store</DialogTitle>
            <DialogDescription>
              Select an employee to assign to {store.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.length === 0 ? (
                    <SelectItem value="" disabled>No available employees</SelectItem>
                  ) : (
                    availableEmployees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_primary"
                checked={isPrimary}
                onCheckedChange={setIsPrimary}
              />
              <Label htmlFor="is_primary">Set as primary store for this employee</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedEmployee || assignEmployee.isPending}
            >
              {assignEmployee.isPending ? "Assigning..." : "Assign Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Employee Confirmation */}
      <AlertDialog open={!!removeEmployee} onOpenChange={() => setRemoveEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee from Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeEmployee?.employee?.first_name}{" "}
              {removeEmployee?.employee?.last_name} from {store.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
