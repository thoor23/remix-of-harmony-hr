import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CalendarCheck, BookOpen, Shield, Banknote, Clock } from "lucide-react";
import { leaveTypes } from "@/data/mockData";
import { toast } from "sonner";

interface LeaveRules {
  minNoticePeriod: number;
  maxConsecutiveLeaves: number;
  sandwichRule: boolean;
  probationLeaveAllowed: boolean;
  probationMonths: number;
  maxCarryForwardDays: number;
  encashmentMinBalance: number;
  maxEncashmentDays: number;
}

export default function LeavePolicy() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("types");

  // Leave Rules state
  const [leaveRules, setLeaveRules] = useState<LeaveRules>({
    minNoticePeriod: 3,
    maxConsecutiveLeaves: 5,
    sandwichRule: true,
    probationLeaveAllowed: false,
    probationMonths: 6,
    maxCarryForwardDays: 5,
    encashmentMinBalance: 10,
    maxEncashmentDays: 15,
  });

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [maxDays, setMaxDays] = useState("12");
  const [color, setColor] = useState("#10B981");
  const [carryForward, setCarryForward] = useState(false);
  const [encashable, setEncashable] = useState(false);
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    setEditingType(null);
    setName("");
    setCode("");
    setMaxDays("12");
    setColor("#10B981");
    setCarryForward(false);
    setEncashable(false);
    setDescription("");
    setIsDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const type = leaveTypes.find((t) => t.id === id);
    if (type) {
      setEditingType(id);
      setName(type.name);
      setCode(type.code);
      setMaxDays(type.maxDays.toString());
      setColor(type.color);
      setCarryForward(type.carryForward);
      setEncashable(type.encashable);
      setDescription(type.description || "");
      setIsDialogOpen(true);
    }
  };

  const handleSave = () => {
    toast.success(
      editingType ? "Leave type updated successfully" : "Leave type added successfully"
    );
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    toast.success("Leave type deleted successfully");
  };

  const saveLeaveRules = () => {
    toast.success("Leave rules saved successfully");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Leave Policy & Rules"
        description="Configure leave types and policies for your organization"
      >
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Leave Type
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="types" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Leave Types</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">General Rules</span>
          </TabsTrigger>
          <TabsTrigger value="probation" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Probation</span>
          </TabsTrigger>
          <TabsTrigger value="encashment" className="gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Carry Forward & Encashment</span>
          </TabsTrigger>
        </TabsList>

        {/* Leave Types Tab */}
        <TabsContent value="types">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{leaveTypes.length}</p>
                    <p className="text-sm text-muted-foreground">Leave Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CalendarCheck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {leaveTypes.reduce((sum, t) => sum + t.maxDays, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Days/Year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <CalendarCheck className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {leaveTypes.filter((t) => t.carryForward).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Carry Forward</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Leave Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-center">Max Days</TableHead>
                <TableHead className="text-center">Carry Forward</TableHead>
                <TableHead className="text-center">Encashable</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="font-medium">{type.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {type.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {type.maxDays}
                  </TableCell>
                  <TableCell className="text-center">
                    {type.carryForward ? (
                      <span className="text-success">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {type.encashable ? (
                      <span className="text-success">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(type.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        {/* General Rules Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                General Leave Rules
              </CardTitle>
              <CardDescription>Configure general leave application rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Notice Period (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={leaveRules.minNoticePeriod}
                    onChange={(e) => setLeaveRules(prev => ({ ...prev, minNoticePeriod: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Days required before leave start date</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Consecutive Leaves (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={leaveRules.maxConsecutiveLeaves}
                    onChange={(e) => setLeaveRules(prev => ({ ...prev, maxConsecutiveLeaves: parseInt(e.target.value) || 5 }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum consecutive leave days allowed</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Sandwich Rule</Label>
                  <p className="text-sm text-muted-foreground">
                    Count weekends/holidays between leaves as leave days
                  </p>
                </div>
                <Switch
                  checked={leaveRules.sandwichRule}
                  onCheckedChange={(checked) => setLeaveRules(prev => ({ ...prev, sandwichRule: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Require Manager Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    All leave requests require manager approval
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Half-Day Leaves</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to apply for half-day leaves
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button onClick={saveLeaveRules}>Save Rules</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Probation Tab */}
        <TabsContent value="probation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Probation Period Rules
              </CardTitle>
              <CardDescription>Configure leave rules for employees on probation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Allow Leave During Probation</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to take leave during probation period
                  </p>
                </div>
                <Switch
                  checked={leaveRules.probationLeaveAllowed}
                  onCheckedChange={(checked) => setLeaveRules(prev => ({ ...prev, probationLeaveAllowed: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Probation Period (months)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={leaveRules.probationMonths}
                  onChange={(e) => setLeaveRules(prev => ({ ...prev, probationMonths: parseInt(e.target.value) || 6 }))}
                />
                <p className="text-xs text-muted-foreground">Duration of probation period for new employees</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Pro-rata Leave Accrual</Label>
                  <p className="text-sm text-muted-foreground">
                    Calculate leave entitlement based on joining date
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Limit Leave Types During Probation</Label>
                  <p className="text-sm text-muted-foreground">
                    Only allow specific leave types during probation
                  </p>
                </div>
                <Switch />
              </div>

              <Button onClick={saveLeaveRules}>Save Rules</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carry Forward & Encashment Tab */}
        <TabsContent value="encashment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Carry Forward & Encashment Rules
              </CardTitle>
              <CardDescription>Configure year-end leave policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Carry Forward Days</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={leaveRules.maxCarryForwardDays}
                    onChange={(e) => setLeaveRules(prev => ({ ...prev, maxCarryForwardDays: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum days that can be carried to next year</p>
                </div>
                <div className="space-y-2">
                  <Label>Carry Forward Expiry (months)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    defaultValue={3}
                  />
                  <p className="text-xs text-muted-foreground">Months until carry-forward leaves expire</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Min Balance for Encashment</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={leaveRules.encashmentMinBalance}
                    onChange={(e) => setLeaveRules(prev => ({ ...prev, encashmentMinBalance: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Minimum leave balance before encashment allowed</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Encashment Days</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={leaveRules.maxEncashmentDays}
                    onChange={(e) => setLeaveRules(prev => ({ ...prev, maxEncashmentDays: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum days that can be encashed per year</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Auto-Encash Expired Leaves</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically encash leaves that are about to expire
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Notify Before Expiry</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders before leaves expire
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button onClick={saveLeaveRules}>Save Rules</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Leave Type" : "Add Leave Type"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Casual Leave"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  placeholder="e.g., CL"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Days Per Year *</Label>
                <Input
                  type="number"
                  placeholder="12"
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this leave type..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Carry Forward</p>
                <p className="text-sm text-muted-foreground">
                  Unused leaves can be carried to next year
                </p>
              </div>
              <Switch checked={carryForward} onCheckedChange={setCarryForward} />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Encashable</p>
                <p className="text-sm text-muted-foreground">
                  Unused leaves can be converted to cash
                </p>
              </div>
              <Switch checked={encashable} onCheckedChange={setEncashable} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingType ? "Update" : "Add"} Leave Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
