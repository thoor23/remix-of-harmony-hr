import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function DateTimePicker({
  value = "",
  onChange,
  placeholder = "Pick date and time",
  disabled = false,
  className,
  error = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse ISO datetime or empty
  const parseDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return { date: undefined, hours: 9, minutes: 0 };
    try {
      const dt = parseISO(dateTimeStr);
      return {
        date: dt,
        hours: dt.getHours(),
        minutes: dt.getMinutes(),
      };
    } catch {
      return { date: undefined, hours: 9, minutes: 0 };
    }
  };

  const { date, hours, minutes } = parseDateTime(value);

  const formatDateTime = (d: Date | undefined, h: number, m: number) => {
    if (!d) return "";
    const newDate = new Date(d);
    newDate.setHours(h, m, 0, 0);
    return newDate.toISOString().slice(0, 16); // Returns "YYYY-MM-DDTHH:mm"
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(formatDateTime(selectedDate, hours, minutes));
    }
  };

  const handleHourChange = (newHour: number) => {
    onChange(formatDateTime(date || new Date(), newHour, minutes));
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(formatDateTime(date || new Date(), hours, newMinute));
  };

  const displayValue = () => {
    if (!value || !date) return placeholder;
    return format(date, "PPP 'at' HH:mm");
  };

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
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="flex">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />

          {/* Time Picker */}
          <div className="border-l p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Time
            </div>
            <div className="flex gap-2">
              {/* Hours */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1 text-center">Hour</span>
                <div className="h-40 w-14 overflow-y-auto border rounded-md">
                  <div className="flex flex-col p-1">
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <Button
                        key={h}
                        variant={hours === h ? "default" : "ghost"}
                        size="sm"
                        className="w-full h-8 shrink-0"
                        onClick={() => handleHourChange(h)}
                      >
                        {h.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Minutes */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1 text-center">Min</span>
                <div className="h-40 w-14 overflow-y-auto border rounded-md">
                  <div className="flex flex-col p-1">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <Button
                        key={m}
                        variant={minutes === m ? "default" : "ghost"}
                        size="sm"
                        className="w-full h-8 shrink-0"
                        onClick={() => handleMinuteChange(m)}
                      >
                        {m.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
