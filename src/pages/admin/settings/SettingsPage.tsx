import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Briefcase,
  Shield,
  Settings2,
  Clock,
  Bell,
  Globe,
  Search,
  Users,
} from "lucide-react";
import { departments as initialDepartments, designations as initialDesignations } from "@/data/mockData";
import {
  defaultCompanySettings,
  defaultAttendanceSettings,
  defaultNotificationSettings,
  defaultSystemPreferences,
  defaultRoles,
  timezones,
  dateFormats,
  currencies,
  languages,
  weekDays,
  modules,
} from "@/data/settingsData";
import { Department, Designation } from "@/types/hrms";
import { Role, RolePermission, CompanySettings, AttendanceSettings, NotificationSettings, SystemPreferences } from "@/types/settings";
import { PermissionMatrix } from "@/components/settings/PermissionMatrix";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { toast } from "sonner";

export default function SettingsPage() {
  // Departments state
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [deleteDeptDialog, setDeleteDeptDialog] = useState<Department | null>(null);

  // Designations state
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations);
  const [desSearch, setDesSearch] = useState("");
  const [desDialogOpen, setDesDialogOpen] = useState(false);
  const [editingDes, setEditingDes] = useState<Designation | null>(null);
  const [desForm, setDesForm] = useState({ name: "", code: "", level: 1, departmentId: "" });
  const [deleteDesDialog, setDeleteDesDialog] = useState<Designation | null>(null);

  // Roles state
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: modules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
  });
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<Role | null>(null);

  // Settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>(defaultAttendanceSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(defaultSystemPreferences);

  // Filtered data
  const filteredDepartments = useMemo(() => 
    departments.filter(d => 
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase())
    ), [departments, deptSearch]);

  const filteredDesignations = useMemo(() => 
    designations.filter(d => 
      d.name.toLowerCase().includes(desSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(desSearch.toLowerCase())
    ), [designations, desSearch]);

  // Department handlers
  const openDeptDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code, description: dept.description || "" });
    } else {
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "" });
    }
    setDeptDialogOpen(true);
  };

  const saveDept = () => {
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      toast.error("Name and Code are required");
      return;
    }

    if (editingDept) {
      setDepartments(prev => prev.map(d => 
        d.id === editingDept.id 
          ? { ...d, name: deptForm.name, code: deptForm.code, description: deptForm.description }
          : d
      ));
      toast.success("Department updated successfully");
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
        description: deptForm.description,
        employeeCount: 0,
      };
      setDepartments(prev => [...prev, newDept]);
      toast.success("Department added successfully");
    }
    setDeptDialogOpen(false);
  };

  const deleteDept = () => {
    if (deleteDeptDialog) {
      setDepartments(prev => prev.filter(d => d.id !== deleteDeptDialog.id));
      toast.success("Department deleted successfully");
      setDeleteDeptDialog(null);
    }
  };

  // Designation handlers
  const openDesDialog = (des?: Designation) => {
    if (des) {
      setEditingDes(des);
      setDesForm({ name: des.name, code: des.code, level: des.level, departmentId: des.departmentId || "" });
    } else {
      setEditingDes(null);
      setDesForm({ name: "", code: "", level: 1, departmentId: "" });
    }
    setDesDialogOpen(true);
  };

  const saveDes = () => {
    if (!desForm.name.trim() || !desForm.code.trim()) {
      toast.error("Name and Code are required");
      return;
    }

    if (editingDes) {
      setDesignations(prev => prev.map(d => 
        d.id === editingDes.id 
          ? { ...d, name: desForm.name, code: desForm.code, level: desForm.level, departmentId: desForm.departmentId }
          : d
      ));
      toast.success("Designation updated successfully");
    } else {
      const newDes: Designation = {
        id: `des-${Date.now()}`,
        name: desForm.name,
        code: desForm.code.toUpperCase(),
        level: desForm.level,
        departmentId: desForm.departmentId || undefined,
      };
      setDesignations(prev => [...prev, newDes]);
      toast.success("Designation added successfully");
    }
    setDesDialogOpen(false);
  };

  const deleteDes = () => {
    if (deleteDesDialog) {
      setDesignations(prev => prev.filter(d => d.id !== deleteDesDialog.id));
      toast.success("Designation deleted successfully");
      setDeleteDesDialog(null);
    }
  };

  // Role handlers
  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description, permissions: [...role.permissions] });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: "",
        description: "",
        permissions: modules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
      });
    }
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (editingRole) {
      setRoles(prev => prev.map(r => 
        r.id === editingRole.id 
          ? { ...r, name: roleForm.name, description: roleForm.description, permissions: roleForm.permissions }
          : r
      ));
      toast.success("Role updated successfully");
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        userCount: 0,
        permissions: roleForm.permissions,
      };
      setRoles(prev => [...prev, newRole]);
      toast.success("Role added successfully");
    }
    setRoleDialogOpen(false);
  };

  const deleteRole = () => {
    if (deleteRoleDialog) {
      setRoles(prev => prev.filter(r => r.id !== deleteRoleDialog.id));
      toast.success("Role deleted successfully");
      setDeleteRoleDialog(null);
    }
  };

  // Settings save handlers
  const saveCompanySettings = () => {
    toast.success("Company settings saved successfully");
  };

  const saveAttendanceSettings = () => {
    toast.success("Attendance settings saved successfully");
  };

  const saveNotificationSettings = () => {
    toast.success("Notification settings saved successfully");
  };

  const saveSystemPreferences = () => {
    toast.success("System preferences saved successfully");
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <PageHeader
        title="Settings"
        description="Manage organization settings, departments, designations, and roles"
      />

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="designations" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Designations</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Departments</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="pl-8 w-full sm:w-[200px]"
                  />
                </div>
                <Button onClick={() => openDeptDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="hidden md:table-cell">Employees</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No departments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">{dept.code}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {dept.employeeCount}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                            {dept.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openDeptDialog(dept)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setDeleteDeptDialog(dept)}
                                disabled={dept.employeeCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designations Tab */}
        <TabsContent value="designations">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Designations</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={desSearch}
                    onChange={(e) => setDesSearch(e.target.value)}
                    className="pl-8 w-full sm:w-[200px]"
                  />
                </div>
                <Button onClick={() => openDesDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="hidden md:table-cell">Department</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDesignations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No designations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDesignations.map((des) => (
                        <TableRow key={des.id}>
                          <TableCell className="font-medium">{des.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">{des.code}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Level {des.level}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {des.departmentId 
                              ? departments.find(d => d.id === des.departmentId)?.name || "-"
                              : "All Departments"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openDesDialog(des)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteDesDialog(des)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Roles & Permissions</CardTitle>
              <Button onClick={() => openRoleDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {role.name}
                            {role.isSystem && (
                              <Badge variant="outline" className="text-xs">System</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {role.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {role.userCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openRoleDialog(role)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!role.isSystem && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setDeleteRoleDialog(role)}
                                disabled={role.userCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <div className="grid gap-6">
            <SettingsCard
              title="Company Information"
              description="Basic information about your organization"
              action={<Button onClick={saveCompanySettings}>Save Changes</Button>}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companySettings.companyName}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Regional Settings"
              description="Configure timezone, currency, and date formats"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={companySettings.timezone}
                    onValueChange={(value) => setCompanySettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={companySettings.dateFormat}
                    onValueChange={(value) => setCompanySettings(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format} value={format}>{format}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={companySettings.currency}
                    onValueChange={(value) => setCompanySettings(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Financial Year Starts</Label>
                  <Select
                    value={companySettings.financialYearStart}
                    onValueChange={(value) => setCompanySettings(prev => ({ ...prev, financialYearStart: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["January", "April", "July", "October"].map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsCard>
          </div>
        </TabsContent>

        {/* Attendance Settings Tab */}
        <TabsContent value="attendance">
          <SettingsCard
            title="Attendance Configuration"
            description="Set up working hours, grace periods, and overtime settings"
            action={<Button onClick={saveAttendanceSettings}>Save Changes</Button>}
          >
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Work Start Time</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.workStartTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, workStartTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work End Time</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.workEndTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, workEndTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grace Period (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={attendanceSettings.graceMinutes}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, graceMinutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Half-Day Cutoff</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.halfDayCutoff}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, halfDayCutoff: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Hours for Full Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={attendanceSettings.minHoursForFullDay}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, minHoursForFullDay: parseInt(e.target.value) || 8 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto Checkout Time</Label>
                  <Input
                    type="time"
                    value={attendanceSettings.autoCheckoutTime}
                    onChange={(e) => setAttendanceSettings(prev => ({ ...prev, autoCheckoutTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Weekend Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      variant={attendanceSettings.weekends.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAttendanceSettings(prev => ({
                          ...prev,
                          weekends: prev.weekends.includes(day)
                            ? prev.weekends.filter(d => d !== day)
                            : [...prev.weekends, day]
                        }));
                      }}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Overtime Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track hours worked beyond regular working hours
                  </p>
                </div>
                <Switch
                  checked={attendanceSettings.allowOvertimeTracking}
                  onCheckedChange={(checked) => setAttendanceSettings(prev => ({ ...prev, allowOvertimeTracking: checked }))}
                />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <SettingsCard
            title="Notification Preferences"
            description="Configure email and in-app notification settings"
            action={<Button onClick={saveNotificationSettings}>Save Changes</Button>}
          >
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'leaveApprovalAlerts', label: 'Leave Approval Alerts', desc: 'Get notified when leave requests need approval or are approved/rejected' },
                { key: 'attendanceReminders', label: 'Attendance Reminders', desc: 'Daily reminders for check-in and check-out' },
                { key: 'birthdayAnnouncements', label: 'Birthday Announcements', desc: 'Celebrate team birthdays with announcements' },
                { key: 'payslipNotifications', label: 'Payslip Notifications', desc: 'Notify employees when payslips are generated' },
                { key: 'systemUpdates', label: 'System Updates', desc: 'Receive notifications about system maintenance and updates' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[item.key as keyof NotificationSettings]}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </SettingsCard>
        </TabsContent>

        {/* System Preferences Tab */}
        <TabsContent value="system">
          <div className="grid gap-6">
            <SettingsCard
              title="Display Settings"
              description="Language and theme preferences"
              action={<Button onClick={saveSystemPreferences}>Save Changes</Button>}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={systemPreferences.language}
                    onValueChange={(value) => setSystemPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={systemPreferences.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setSystemPreferences(prev => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Security Settings"
              description="Session and password policies"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={systemPreferences.sessionTimeout}
                    onChange={(e) => setSystemPreferences(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password Expiry (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={systemPreferences.passwordExpiryDays}
                    onChange={(e) => setSystemPreferences(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) || 90 }))}
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 to disable password expiry</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    min={6}
                    max={32}
                    value={systemPreferences.passwordMinLength}
                    onChange={(e) => setSystemPreferences(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                  </div>
                  <Switch
                    checked={systemPreferences.requireSpecialChars}
                    onCheckedChange={(checked) => setSystemPreferences(prev => ({ ...prev, requireSpecialChars: checked }))}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department information" : "Create a new department"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Engineering"
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., ENG"
                value={deptForm.code}
                onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the department"
                value={deptForm.description}
                onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDept}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={desDialogOpen} onOpenChange={setDesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDes ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription>
              {editingDes ? "Update designation information" : "Create a new designation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Software Engineer"
                value={desForm.name}
                onChange={(e) => setDesForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., SWE"
                value={desForm.code}
                onChange={(e) => setDesForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={desForm.level}
                onChange={(e) => setDesForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">Higher level = more senior position</p>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={desForm.departmentId}
                onValueChange={(value) => setDesForm(prev => ({ ...prev, departmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDes}>
              {editingDes ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update role and permissions" : "Create a new role with custom permissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., Team Lead"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the role"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionMatrix
                permissions={roleForm.permissions}
                onChange={(permissions) => setRoleForm(prev => ({ ...prev, permissions }))}
                disabled={editingRole?.isSystem && editingRole.name === "Admin"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <DeleteConfirmDialog
        open={!!deleteDeptDialog}
        onOpenChange={(open) => !open && setDeleteDeptDialog(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        itemName={deleteDeptDialog?.name}
        warningText={deleteDeptDialog?.employeeCount ? `${deleteDeptDialog.employeeCount} employees are assigned to this department.` : undefined}
        onConfirm={deleteDept}
      />

      <DeleteConfirmDialog
        open={!!deleteDesDialog}
        onOpenChange={(open) => !open && setDeleteDesDialog(null)}
        title="Delete Designation"
        description="Are you sure you want to delete this designation? This action cannot be undone."
        itemName={deleteDesDialog?.name}
        onConfirm={deleteDes}
      />

      <DeleteConfirmDialog
        open={!!deleteRoleDialog}
        onOpenChange={(open) => !open && setDeleteRoleDialog(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        itemName={deleteRoleDialog?.name}
        warningText={deleteRoleDialog?.userCount ? `${deleteRoleDialog.userCount} users are assigned to this role.` : undefined}
        onConfirm={deleteRole}
      />
    </PageContainer>
  );
}
