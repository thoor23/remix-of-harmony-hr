import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  X,
  Clock
} from "lucide-react";
import { ShiftAssignment, Shift } from "@/types/settings";
import { defaultShiftAssignments, defaultShifts } from "@/data/settingsData";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock employees with department
const mockEmployees = [
  { id: "emp-1", name: "John Doe", department: "Engineering" },
  { id: "emp-2", name: "Jane Smith", department: "Marketing" },
  { id: "emp-3", name: "Mike Johnson", department: "Sales" },
  { id: "emp-4", name: "Sarah Wilson", department: "Operations" },
  { id: "emp-5", name: "David Brown", department: "Engineering" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ShiftCalendar() {
  const [assignments] = useState<ShiftAssignment[]>(defaultShiftAssignments);
  const [shifts] = useState<Shift[]>(defaultShifts);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const departments = [...new Set(mockEmployees.map(e => e.department))];

  const filteredAssignments = assignments.filter(a => 
    !departmentFilter || a.department === departmentFilter
  );

  const getShiftById = (id: string) => shifts.find(s => s.id === id);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [startingDay, daysInMonth]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAssignmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredAssignments.filter(a => {
      const effectiveFrom = new Date(a.effectiveFrom);
      const effectiveTo = a.effectiveTo ? new Date(a.effectiveTo) : null;
      const currentDate = new Date(dateStr);
      
      return currentDate >= effectiveFrom && (!effectiveTo || currentDate <= effectiveTo);
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Group assignments by shift for the legend
  const shiftCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAssignments.forEach(a => {
      counts[a.shiftId] = (counts[a.shiftId] || 0) + 1;
    });
    return counts;
  }, [filteredAssignments]);

  const selectedDayAssignments = selectedDay ? getAssignmentsForDay(selectedDay) : [];
  const selectedDateStr = selectedDay 
    ? `${MONTHS[month]} ${selectedDay}, ${year}` 
    : "";

  // Group selected day assignments by shift
  const groupedByShift = useMemo(() => {
    const groups: Record<string, ShiftAssignment[]> = {};
    selectedDayAssignments.forEach(a => {
      if (!groups[a.shiftId]) groups[a.shiftId] = [];
      groups[a.shiftId].push(a);
    });
    return groups;
  }, [selectedDayAssignments]);

  return (
    <PageContainer>
      <PageHeader 
        title="Shift Calendar" 
        description="View employee shift assignments in calendar format"
      />

      {/* Stats/Legend */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MONTHS[month]}</p>
                <p className="text-sm text-muted-foreground">{year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {shifts.slice(0, 3).map(shift => (
          <Card key={shift.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${shift.color}20` }}
                >
                  <Users className="h-6 w-6" style={{ color: shift.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{shiftCounts[shift.id] || 0}</p>
                  <p className="text-sm text-muted-foreground">{shift.name} Shift</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="min-w-[180px] text-center">
                {MONTHS[month]} {year}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={departmentFilter || "_all"} onValueChange={(v) => setDepartmentFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((day, idx) => (
              <div 
                key={day} 
                className={`text-center text-sm font-semibold py-3 ${
                  idx === 0 || idx === 6 ? "text-muted-foreground" : ""
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayAssignments = day ? getAssignmentsForDay(day) : [];
              const isWeekend = index % 7 === 0 || index % 7 === 6;
              
              return (
                <div
                  key={index}
                  onClick={() => day !== null && setSelectedDay(day)}
                  className={`min-h-[120px] border-b border-r p-2 ${
                    index % 7 === 0 ? "border-l" : ""
                  } ${
                    day === null 
                      ? "bg-muted/20" 
                      : isToday(day)
                        ? "bg-primary/5 cursor-pointer hover:bg-primary/10"
                        : isWeekend
                          ? "bg-muted/10 cursor-pointer hover:bg-muted/20"
                          : "bg-background cursor-pointer hover:bg-muted/50"
                  } transition-colors`}
                >
                  {day !== null && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${
                        isToday(day) 
                          ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center" 
                          : isWeekend 
                            ? "text-muted-foreground"
                            : ""
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayAssignments.slice(0, 4).map((assignment) => {
                          const shift = getShiftById(assignment.shiftId);
                          return shift ? (
                            <div
                              key={assignment.id}
                              className="flex items-center gap-1.5 text-xs"
                              title={`${assignment.employeeName} - ${shift.name}`}
                            >
                              <span 
                                className="w-1 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: shift.color }}
                              />
                              <span className="truncate">
                                {assignment.employeeName.split(' ')[0]}
                              </span>
                            </div>
                          ) : null;
                        })}
                        {dayAssignments.length > 4 && (
                          <div className="text-xs text-muted-foreground pl-2.5">
                            +{dayAssignments.length - 4} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shift Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {shifts.filter(s => s.isActive).map((shift) => (
              <div key={shift.id} className="flex items-center gap-2">
                <ShiftBadge 
                  name={shift.name} 
                  color={shift.color}
                  isNightShift={shift.isNightShift}
                  isFlexible={shift.isFlexible}
                />
                <span className="text-sm text-muted-foreground">
                  {shift.isFlexible ? "Flexible" : `${shift.startTime} - ${shift.endTime}`}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {shiftCounts[shift.id] || 0} employees
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDateStr}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden py-2">
            {selectedDayAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No shifts scheduled for this day</p>
              </div>
            ) : (
              <div className="h-full max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {Object.entries(groupedByShift).map(([shiftId, shiftAssignments]) => {
                    const shift = getShiftById(shiftId);
                    if (!shift) return null;
                    
                    return (
                      <div key={shiftId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <ShiftBadge 
                            name={shift.name} 
                            color={shift.color}
                            isNightShift={shift.isNightShift}
                            isFlexible={shift.isFlexible}
                          />
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {shift.isFlexible ? "Flexible" : `${shift.startTime} - ${shift.endTime}`}
                          </div>
                        </div>
                        <div className="pl-2 border-l-2 space-y-1" style={{ borderColor: shift.color }}>
                          {shiftAssignments.map((assignment) => (
                            <div 
                              key={assignment.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-sm">{assignment.employeeName}</p>
                                <p className="text-xs text-muted-foreground">{assignment.department}</p>
                              </div>
                              <span className="text-xs border rounded px-2 py-0.5">
                                {assignment.employeeCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedDayAssignments.length} employee{selectedDayAssignments.length !== 1 ? 's' : ''} scheduled
            </p>
            <Button variant="outline" size="sm" onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}