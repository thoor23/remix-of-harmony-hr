import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Json } from "@/integrations/supabase/types";

export interface SystemSetting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      return api.get<SystemSetting[]>("/settings");
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ["system-setting", key],
    queryFn: async () => {
      try {
        return await api.get<SystemSetting>(`/settings/${key}`);
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> | Json }) => {
      return api.put(`/settings/${key}`, { value });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-setting", variables.key] });
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}

// Type-safe hooks for specific settings
export interface AttendancePolicySettings {
  workingHoursPerDay: number;
  lateThresholdMinutes: number;
  halfDayHours: number;
  overtimeThresholdHours: number;
  weekendDays: string[];
  autoCheckoutTime: string;
  allowRemoteCheckIn: boolean;
  requireLocationVerification: boolean;
}

export interface LeavePolicySettings {
  minAdvanceNotice: number;
  maxConsecutiveDays: number;
  requireDocumentForSickLeave: boolean;
  sickLeaveDocumentDays: number;
  allowHalfDayLeave: boolean;
  carryForwardLimit: number;
  encashmentLimit: number;
}

export interface ShiftPolicySettings {
  minRestBetweenShifts: number;
  maxConsecutiveWorkDays: number;
  allowShiftExchange: boolean;
  requireManagerApproval: boolean;
  exchangeRequestDeadlineHours: number;
  overtimeMultiplier: number;
  weekendMultiplier: number;
}

export interface PayrollPolicySettings {
  payDay: number;
  payFrequency: string;
  currency: string;
  taxCalculationMethod: string;
  pfContributionPercent: number;
  esicContributionPercent: number;
}

export function useAttendancePolicy() {
  const { data, ...rest } = useSystemSetting("attendance_policy");
  return {
    data: data?.value as unknown as AttendancePolicySettings | undefined,
    ...rest,
  };
}

export function useLeavePolicy() {
  const { data, ...rest } = useSystemSetting("leave_policy");
  return {
    data: data?.value as unknown as LeavePolicySettings | undefined,
    ...rest,
  };
}

export function useShiftPolicy() {
  const { data, ...rest } = useSystemSetting("shift_policy");
  return {
    data: data?.value as unknown as ShiftPolicySettings | undefined,
    ...rest,
  };
}

export function usePayrollPolicy() {
  const { data, ...rest } = useSystemSetting("payroll_policy");
  return {
    data: data?.value as unknown as PayrollPolicySettings | undefined,
    ...rest,
  };
}
