import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shift } from "@/types/settings";
import { shiftColors } from "@/data/settingsData";

interface ShiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  onSave: (shift: Partial<Shift>) => void;
  existingCodes: string[];
}

const emptyShift: Partial<Shift> = {
  name: "",
  code: "",
  startTime: "09:00",
  endTime: "18:00",
  breakDuration: 60,
  gracePeriod: 15,
  isNightShift: false,
  isFlexible: false,
  color: shiftColors[0].value,
  isDefault: false,
  isActive: true,
};

export function ShiftForm({ 
  open, 
  onOpenChange, 
  shift, 
  onSave,
  existingCodes 
}: ShiftFormProps) {
  const [form, setForm] = useState<Partial<Shift>>(emptyShift);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shift) {
      setForm(shift);
    } else {
      setForm(emptyShift);
    }
    setErrors({});
  }, [shift, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name?.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!form.code?.trim()) {
      newErrors.code = "Code is required";
    } else if (form.code.length > 10) {
      newErrors.code = "Code must be 10 characters or less";
    } else if (
      existingCodes.includes(form.code.toUpperCase()) && 
      (!shift || shift.code !== form.code.toUpperCase())
    ) {
      newErrors.code = "Code already exists";
    }
    
    if (!form.isFlexible) {
      if (!form.startTime) newErrors.startTime = "Start time is required";
      if (!form.endTime) newErrors.endTime = "End time is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...form,
        code: form.code?.toUpperCase(),
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit Shift" : "Add New Shift"}</DialogTitle>
          <DialogDescription>
            {shift ? "Update shift details" : "Create a new work shift"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shift Name *</Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Morning"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., MOR"
                maxLength={10}
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="flexible">Flexible Hours</Label>
            <Switch
              id="flexible"
              checked={form.isFlexible || false}
              onCheckedChange={(checked) => setForm({ ...form, isFlexible: checked })}
            />
          </div>

          {!form.isFlexible && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <TimePicker
                  value={form.startTime || "09:00"}
                  onChange={(value) => setForm({ ...form, startTime: value })}
                  placeholder="Select start time"
                  error={!!errors.startTime}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <TimePicker
                  value={form.endTime || "18:00"}
                  onChange={(value) => setForm({ ...form, endTime: value })}
                  placeholder="Select end time"
                  error={!!errors.endTime}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakDuration">Break Duration (min)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={0}
                max={120}
                value={form.breakDuration || 60}
                onChange={(e) => setForm({ ...form, breakDuration: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (min)</Label>
              <Input
                id="gracePeriod"
                type="number"
                min={0}
                max={60}
                value={form.gracePeriod || 0}
                onChange={(e) => setForm({ ...form, gracePeriod: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Select 
              value={form.color} 
              onValueChange={(value) => setForm({ ...form, color: value })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: form.color }}
                    />
                    {shiftColors.find(c => c.value === form.color)?.name || "Select color"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {shiftColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="nightShift">Night Shift</Label>
            <Switch
              id="nightShift"
              checked={form.isNightShift || false}
              onCheckedChange={(checked) => setForm({ ...form, isNightShift: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={form.isActive ?? true}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {shift ? "Update" : "Create"} Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}