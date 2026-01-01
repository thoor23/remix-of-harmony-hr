import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return (data || []) as SystemSetting[];
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ["system-setting", key],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const companyId = await getCompanyId(user.id);
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('company_id', companyId)
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error('Error fetching setting:', error);
        return null;
      }
      return data as SystemSetting | null;
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> | Json }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Check if setting exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('company_id', companyId)
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: value as any })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([{
            key,
            value: value as any,
            company_id: companyId,
            category: 'general',
          }]);

        if (error) throw error;
      }
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
