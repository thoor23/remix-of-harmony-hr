import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TodayAttendance {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  date: string;
}

export const ClockInOutButton = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

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
      .channel("attendance-clock")
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

  const handleClockIn = async () => {
    if (!employeeId) {
      toast.error("Employee record not found");
      return;
    }

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");
    const today = format(new Date(), "yyyy-MM-dd");

    const { error } = await supabase.from("attendance_records").insert({
      employee_id: employeeId,
      date: today,
      check_in: currentTime,
      status: "present",
    });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        // Duplicate - record already exists, just refresh state
        toast.info("Already clocked in for today");
        // Refetch the record
        const { data } = await supabase
          .from("attendance_records")
          .select("id, check_in, check_out, status, date")
          .eq("employee_id", employeeId)
          .eq("date", today)
          .maybeSingle();
        if (data) setTodayRecord(data);
      } else {
        toast.error("Failed to clock in");
        console.error(error);
      }
    } else {
      toast.success(`Clocked in at ${format(new Date(), "h:mm a")}`);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");

    // Calculate work hours if check_in exists
    let workHours = null;
    if (todayRecord.check_in) {
      const checkInTime = new Date(`2000-01-01T${todayRecord.check_in}`);
      const checkOutTime = new Date(`2000-01-01T${currentTime}`);
      workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    const { error } = await supabase
      .from("attendance_records")
      .update({
        check_out: currentTime,
        work_hours: workHours,
      })
      .eq("id", todayRecord.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to clock out");
      console.error(error);
    } else {
      toast.success(`Clocked out at ${format(new Date(), "h:mm a")}`);
    }
  };

  const isClockedIn = todayRecord?.check_in && !todayRecord?.check_out;
  const isClockedOut = todayRecord?.check_in && todayRecord?.check_out;

  if (!employeeId) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isClockedOut ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-2 text-muted-foreground"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Done for today</span>
            </Button>
          ) : isClockedIn ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClockOut}
              disabled={loading}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Clock Out</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleClockIn}
              disabled={loading}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Clock In</span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {isClockedOut ? (
            <p>
              Worked: {todayRecord.check_in?.slice(0, 5)} - {todayRecord.check_out?.slice(0, 5)}
            </p>
          ) : isClockedIn ? (
            <p>Clocked in at {todayRecord.check_in?.slice(0, 5)}</p>
          ) : (
            <p>Start your workday</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
