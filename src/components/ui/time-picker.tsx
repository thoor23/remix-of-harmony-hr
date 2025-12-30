import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  use24Hour?: boolean;
}

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Pick a time",
  disabled = false,
  className,
  error = false,
  use24Hour = true,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the time value (HH:mm format)
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: 9, minutes: 0 };
    const [h, m] = timeStr.split(":").map(Number);
    return { hours: h || 0, minutes: m || 0 };
  };

  const { hours, minutes } = parseTime(value);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const { hours: h, minutes: m } = parseTime(timeStr);
    if (use24Hour) {
      return formatTime(h, m);
    } else {
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 || 12;
      return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
    }
  };

  const handleHourChange = (newHour: number) => {
    onChange(formatTime(newHour, minutes));
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(formatTime(hours, newMinute));
  };

  const hourOptions = use24Hour 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 pointer-events-auto" align="start">
        <div className="flex gap-4">
          {/* Hours */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-2 text-center">Hour</span>
            <ScrollArea className="h-48 w-14">
              <div className="flex flex-col gap-1">
                {hourOptions.map((h) => {
                  const displayHour = use24Hour ? h : h;
                  const actualHour = use24Hour ? h : (h === 12 ? 0 : h);
                  const isSelected = use24Hour 
                    ? hours === h 
                    : (hours % 12 || 12) === h;
                  return (
                    <Button
                      key={h}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (use24Hour) {
                          handleHourChange(h);
                        } else {
                          const newHour = hours >= 12 ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                          handleHourChange(newHour);
                        }
                      }}
                    >
                      {displayHour.toString().padStart(2, "0")}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Minutes */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-2 text-center">Min</span>
            <ScrollArea className="h-48 w-14">
              <div className="flex flex-col gap-1">
                {minuteOptions.filter((m) => m % 5 === 0).map((m) => (
                  <Button
                    key={m}
                    variant={minutes === m ? "default" : "ghost"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleMinuteChange(m)}
                  >
                    {m.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* AM/PM for 12-hour mode */}
          {!use24Hour && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-2 text-center">Period</span>
              <div className="flex flex-col gap-1">
                <Button
                  variant={hours < 12 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (hours >= 12) {
                      handleHourChange(hours - 12);
                    }
                  }}
                >
                  AM
                </Button>
                <Button
                  variant={hours >= 12 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (hours < 12) {
                      handleHourChange(hours + 12);
                    }
                  }}
                >
                  PM
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
