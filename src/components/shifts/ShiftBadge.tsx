import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Clock } from "lucide-react";

interface ShiftBadgeProps {
  name: string;
  color: string;
  isNightShift?: boolean;
  isFlexible?: boolean;
  size?: "sm" | "md";
}

export function ShiftBadge({ 
  name, 
  color, 
  isNightShift, 
  isFlexible,
  size = "md" 
}: ShiftBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 ${size === "sm" ? "text-xs px-2 py-0.5" : "px-2.5 py-1"}`}
      style={{ 
        borderColor: color,
        backgroundColor: `${color}15`,
        color: color 
      }}
    >
      <span 
        className={`rounded-full ${size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"}`}
        style={{ backgroundColor: color }}
      />
      {name}
      {isNightShift && <Moon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {isFlexible && <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
    </Badge>
  );
}