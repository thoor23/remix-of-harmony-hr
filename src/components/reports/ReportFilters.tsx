import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Filter } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface ReportFiltersProps {
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onDepartmentChange?: (department: string) => void;
  departments?: string[];
  showDepartmentFilter?: boolean;
  className?: string;
}

const datePresets = [
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last 3 months", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: "Last 12 months", getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
];

export function ReportFilters({
  onDateRangeChange,
  onDepartmentChange,
  departments = [],
  showDepartmentFilter = true,
  className,
}: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days");

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetConfig = datePresets.find((p) => p.label === preset);
    if (presetConfig) {
      const newRange = presetConfig.getValue();
      setDateRange(newRange);
      onDateRangeChange?.(newRange);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedPreset("Custom");
    onDateRangeChange?.(range);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {datePresets.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="Custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d, yyyy")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {showDepartmentFilter && departments.length > 0 && (
        <Select onValueChange={onDepartmentChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
