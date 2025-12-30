import * as React from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  error = false,
  fromYear = 1940,
  toYear = new Date().getFullYear(),
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            !date && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          {date ? date.toLocaleDateString() : <span>{placeholder}</span>}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
