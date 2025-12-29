import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Trash2, Users, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { useTargetedNotifications, useSendTargetedNotification, useDeleteTargetedNotification, SendTargetedNotificationData } from "@/hooks/useTargetedNotifications";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";

export default function SendNotificationsPage() {
  const { data: notifications = [], isLoading } = useTargetedNotifications();
  const { data: departments = [] } = useDepartmentsData();
  const { data: employees = [] } = useEmployees();
  const sendNotification = useSendTargetedNotification();
  const deleteNotification = useDeleteTargetedNotification();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SendTargetedNotificationData>({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    target_type: "all",
    target_ids: [],
  });

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "normal",
      target_type: "all",
      target_ids: [],
    });
    setSelectedDepartments([]);
    setSelectedEmployees([]);
  };

  const handleSubmit = async () => {
    let target_ids: string[] = [];

    if (formData.target_type === "department") {
      target_ids = selectedDepartments;
    } else if (formData.target_type === "employees") {
      target_ids = selectedEmployees;
    }

    await sendNotification.mutateAsync({
      ...formData,
      target_ids,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTargetDisplay = (notification: any) => {
    if (notification.target_type === "all") {
      return (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          All Employees
        </div>
      );
    }
    if (notification.target_type === "department") {
      return (
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          {notification.target_ids?.length || 0} Department(s)
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <User className="h-4 w-4" />
        {notification.target_ids?.length || 0} Employee(s)
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Send Notifications"
        description="Send targeted notifications to employees"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Targeted Notifications</CardTitle>
            <CardDescription>Send notifications to specific employees or groups</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to selected employees or groups
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Notification message..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Target Recipients</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: "all" | "department" | "employees") =>
                      setFormData({ ...formData, target_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          All Employees
                        </div>
                      </SelectItem>
                      <SelectItem value="department">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          By Department
                        </div>
                      </SelectItem>
                      <SelectItem value="employees">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Specific Employees
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === "department" && (
                  <div>
                    <Label>Select Departments</Label>
                    <ScrollArea className="h-40 border rounded-md p-2">
                      {departments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No departments found</p>
                      ) : (
                        <div className="space-y-2">
                          {departments.map((dept) => (
                            <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dept-${dept.id}`}
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={() => toggleDepartment(dept.id)}
                              />
                              <label
                                htmlFor={`dept-${dept.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {selectedDepartments.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDepartments.length} department(s) selected
                      </p>
                    )}
                  </div>
                )}

                {formData.target_type === "employees" && (
                  <div>
                    <Label>Select Employees</Label>
                    <ScrollArea className="h-48 border rounded-md p-2">
                      {employees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No employees found</p>
                      ) : (
                        <div className="space-y-2">
                          {employees
                            .filter((emp) => emp.status === "active")
                            .map((emp) => (
                              <div key={emp.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`emp-${emp.id}`}
                                  checked={selectedEmployees.includes(emp.id)}
                                  onCheckedChange={() => toggleEmployee(emp.id)}
                                />
                                <label
                                  htmlFor={`emp-${emp.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                                </label>
                              </div>
                            ))}
                        </div>
                      )}
                    </ScrollArea>
                    {selectedEmployees.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEmployees.length} employee(s) selected
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.title ||
                    !formData.message ||
                    (formData.target_type === "department" && selectedDepartments.length === 0) ||
                    (formData.target_type === "employees" && selectedEmployees.length === 0)
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications sent yet. Send your first notification!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>{getTypeBadge(notification.type)}</TableCell>
                    <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                    <TableCell>{getTargetDisplay(notification)}</TableCell>
                    <TableCell>
                      {format(new Date(notification.sent_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Notification Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this notification record? This will
                              not remove notifications already sent to employees.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(notification.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
