import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Coffee, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TodayAttendance {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  date: string;
}

export const AttendanceWidget = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [liveHours, setLiveHours] = useState<string>("0h 0m");
  const [open, setOpen] = useState(false);

  // Fetch employee ID for current user
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setEmployeeId(data.id);
      }
    };

    fetchEmployeeId();
  }, [user?.id]);

  // Fetch today's attendance record
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!employeeId) return;

      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, check_in, check_out, status, date")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .maybeSingle();

      if (!error && data) {
        setTodayRecord(data);
      } else {
        setTodayRecord(null);
      }
    };

    fetchTodayAttendance();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("attendance-widget")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        () => {
          fetchTodayAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId]);

  // Live hours counter
  useEffect(() => {
    if (!todayRecord?.check_in || todayRecord?.check_out) {
      if (todayRecord?.check_out && todayRecord?.check_in) {
        // Calculate final hours
        const checkIn = new Date(`2000-01-01T${todayRecord.check_in}`);
        const checkOut = new Date(`2000-01-01T${todayRecord.check_out}`);
        const diffMs = checkOut.getTime() - checkIn.getTime() - totalBreakMinutes * 60 * 1000;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setLiveHours(`${hours}h ${minutes}m`);
      }
      return;
    }

    const updateLiveHours = () => {
      const checkIn = new Date(`2000-01-01T${todayRecord.check_in}`);
      const now = new Date(`2000-01-01T${format(new Date(), "HH:mm:ss")}`);
      
      let breakMs = totalBreakMinutes * 60 * 1000;
      if (isOnBreak && breakStartTime) {
        breakMs += Date.now() - breakStartTime.getTime();
      }
      
      const diffMs = now.getTime() - checkIn.getTime() - breakMs;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setLiveHours(`${hours}h ${minutes}m`);
    };

    updateLiveHours();
    const interval = setInterval(updateLiveHours, 1000);
    return () => clearInterval(interval);
  }, [todayRecord, isOnBreak, breakStartTime, totalBreakMinutes]);

  const handleClockIn = async () => {
    if (!employeeId) {
      toast.error("Employee record not found");
      return;
    }

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");
    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        employee_id: employeeId,
        date: today,
        check_in: currentTime,
        status: "present",
      })
      .select("id, check_in, check_out, status, date")
      .single();

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        const { data: existingData } = await supabase
          .from("attendance_records")
          .select("id, check_in, check_out, status, date")
          .eq("employee_id", employeeId)
          .eq("date", today)
          .maybeSingle();

        if (existingData) {
          setTodayRecord(existingData);
          toast.info(
            existingData.check_out
              ? "Already clocked out for today"
              : "Already clocked in for today"
          );
        }
      } else {
        toast.error("Failed to clock in");
        console.error(error);
      }
    } else if (data) {
      // Instantly update the UI
      setTodayRecord(data);
      setTotalBreakMinutes(0);
      toast.success(`Clocked in at ${format(new Date(), "h:mm a")}`);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;

    if (isOnBreak) {
      toast.error("Please end your break before clocking out");
      return;
    }

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");

    let workHours: number | null = null;
    if (todayRecord.check_in) {
      const checkInTime = new Date(`2000-01-01T${todayRecord.check_in}`);
      const checkOutTime = new Date(`2000-01-01T${currentTime}`);
      const breakHours = totalBreakMinutes / 60;
      workHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) - breakHours;
    }

    const { data, error } = await supabase
      .from("attendance_records")
      .update({
        check_out: currentTime,
        work_hours: workHours,
      })
      .eq("id", todayRecord.id)
      .select("id, check_in, check_out, status, date")
      .single();

    setLoading(false);

    if (error) {
      toast.error("Failed to clock out");
      console.error(error);
    } else if (data) {
      // Instantly update the UI
      setTodayRecord(data);
      toast.success(`Clocked out at ${format(new Date(), "h:mm a")}`);
    }
  };

  const handleBreakToggle = () => {
    if (!todayRecord?.check_in || todayRecord?.check_out) {
      toast.error("You need to be clocked in to take a break");
      return;
    }

    if (isOnBreak) {
      // End break
      if (breakStartTime) {
        const breakDuration = (Date.now() - breakStartTime.getTime()) / (1000 * 60);
        setTotalBreakMinutes((prev) => prev + breakDuration);
      }
      setIsOnBreak(false);
      setBreakStartTime(null);
      toast.success("Break ended");
    } else {
      // Start break
      setIsOnBreak(true);
      setBreakStartTime(new Date());
      toast.success("Break started");
    }
  };

  const isClockedIn = todayRecord?.check_in && !todayRecord?.check_out;
  const isClockedOut = todayRecord?.check_in && todayRecord?.check_out;

  if (!employeeId) {
    return null;
  }

  const getStatusBadge = () => {
    if (isClockedOut) {
      return <Badge variant="secondary">Done for today</Badge>;
    }
    if (isOnBreak) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">On Break</Badge>;
    }
    if (isClockedIn) {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Working</Badge>;
    }
    return <Badge variant="outline">Not clocked in</Badge>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className={`gap-2 ${
            isClockedIn 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
              : isClockedOut 
                ? "bg-slate-400 hover:bg-slate-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isClockedIn ? liveHours : isClockedOut ? "Done" : "Clock In"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Today's Attendance</h4>
            {getStatusBadge()}
          </div>

          <Separator />

          {/* Time Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Clock In</span>
              <span className="font-medium">
                {todayRecord?.check_in?.slice(0, 5) || "--:--"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Clock Out</span>
              <span className="font-medium">
                {todayRecord?.check_out?.slice(0, 5) || "--:--"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Break</span>
              <span className="font-medium">
                {Math.floor(totalBreakMinutes)}m
              </span>
            </div>
          </div>

          <Separator />

          {/* Live Hours */}
          <div className="text-center py-2">
            <div className="text-3xl font-bold text-primary">{liveHours}</div>
            <p className="text-xs text-muted-foreground">
              {isClockedOut ? "Total worked" : "Working hours"}
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {isClockedOut ? (
              <Button variant="outline" disabled className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Day Complete
              </Button>
            ) : isClockedIn ? (
              <>
                <Button
                  variant={isOnBreak ? "default" : "outline"}
                  size="sm"
                  onClick={handleBreakToggle}
                  className="flex-1"
                >
                  {isOnBreak ? (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Coffee className="h-4 w-4 mr-1" />
                      Break
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClockOut}
                  disabled={loading || isOnBreak}
                  className="flex-1"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Clock Out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={handleClockIn}
                disabled={loading}
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
