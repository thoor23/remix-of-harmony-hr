import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "@/lib/api";
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
  const { employeeId } = useAuth();
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayAttendance = useCallback(async () => {
    if (!employeeId) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const records = await api.get<TodayAttendance[]>(
        `/attendance?employee_id=${employeeId}&date=${today}`
      );
      
      if (records && records.length > 0) {
        setTodayRecord(records[0]);
      } else {
        setTodayRecord(null);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    }
  }, [employeeId]);

  // Fetch today's attendance record and poll for updates
  useEffect(() => {
    fetchTodayAttendance();

    // Poll every 30 seconds for updates (replaces realtime)
    const interval = setInterval(fetchTodayAttendance, 30000);

    return () => clearInterval(interval);
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!employeeId) {
      toast.error("Employee record not found");
      return;
    }

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");
    const today = format(new Date(), "yyyy-MM-dd");

    try {
      await api.post("/attendance", {
        employee_id: employeeId,
        date: today,
        check_in: currentTime,
        status: "present",
      });
      
      toast.success(`Clocked in at ${format(new Date(), "h:mm a")}`);
      fetchTodayAttendance();
    } catch (error: any) {
      if (error.message?.includes("Duplicate") || error.message?.includes("exists")) {
        toast.info("Already clocked in for today");
        fetchTodayAttendance();
      } else {
        toast.error("Failed to clock in");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;

    setLoading(true);
    const currentTime = format(new Date(), "HH:mm:ss");

    // Calculate work hours if check_in exists
    let workHours: number | null = null;
    if (todayRecord.check_in) {
      const checkInTime = new Date(`2000-01-01T${todayRecord.check_in}`);
      const checkOutTime = new Date(`2000-01-01T${currentTime}`);
      workHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    try {
      await api.put(`/attendance/${todayRecord.id}`, {
        check_out: currentTime,
        work_hours: workHours,
      });
      
      toast.success(`Clocked out at ${format(new Date(), "h:mm a")}`);
      fetchTodayAttendance();
    } catch (error) {
      toast.error("Failed to clock out");
      console.error(error);
    } finally {
      setLoading(false);
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
