import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Clock, 
  Users, 
  Moon, 
  Sun, 
  Edit, 
  Trash2, 
  Star,
  Coffee,
  Timer
} from "lucide-react";
import { Shift } from "@/types/settings";

interface ShiftCardProps {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
  onToggleActive: (shift: Shift) => void;
  onSetDefault: (shift: Shift) => void;
}

export function ShiftCard({ 
  shift, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onSetDefault 
}: ShiftCardProps) {
  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        !shift.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Color stripe */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: shift.color }}
      />
      
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span 
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: shift.color }}
            />
            <div>
              <h3 className="font-semibold text-lg">{shift.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{shift.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shift.isDefault && (
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
            {shift.isNightShift && (
              <Badge variant="outline" className="gap-1">
                <Moon className="h-3 w-3" />
                Night
              </Badge>
            )}
            {shift.isFlexible && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Flexible
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {shift.isFlexible ? "Flexible Hours" : `${shift.startTime} - ${shift.endTime}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coffee className="h-4 w-4 text-muted-foreground" />
            <span>{shift.breakDuration} min break</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span>{shift.gracePeriod} min grace</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{shift.employeeCount} employees</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch 
              checked={shift.isActive} 
              onCheckedChange={() => onToggleActive(shift)}
            />
            <span className="text-sm text-muted-foreground">
              {shift.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!shift.isDefault && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onSetDefault(shift)}
                title="Set as default"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(shift)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(shift)}
              disabled={shift.isDefault || shift.employeeCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}