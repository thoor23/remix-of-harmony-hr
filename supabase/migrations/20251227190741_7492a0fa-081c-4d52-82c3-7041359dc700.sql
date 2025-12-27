-- Create system_settings table for storing policy configurations
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage settings, all authenticated users can view
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('attendance_policy', '{
  "workingHoursPerDay": 8,
  "lateThresholdMinutes": 15,
  "halfDayHours": 4,
  "overtimeThresholdHours": 9,
  "weekendDays": ["saturday", "sunday"],
  "autoCheckoutTime": "23:59",
  "allowRemoteCheckIn": true,
  "requireLocationVerification": false
}', 'Attendance policy configuration', 'attendance'),

('leave_policy', '{
  "minAdvanceNotice": 3,
  "maxConsecutiveDays": 10,
  "requireDocumentForSickLeave": true,
  "sickLeaveDocumentDays": 3,
  "allowHalfDayLeave": true,
  "carryForwardLimit": 5,
  "encashmentLimit": 10
}', 'Leave policy configuration', 'leave'),

('shift_policy', '{
  "minRestBetweenShifts": 8,
  "maxConsecutiveWorkDays": 6,
  "allowShiftExchange": true,
  "requireManagerApproval": true,
  "exchangeRequestDeadlineHours": 24,
  "overtimeMultiplier": 1.5,
  "weekendMultiplier": 2.0
}', 'Shift policy configuration', 'shift'),

('payroll_policy', '{
  "payDay": 1,
  "payFrequency": "monthly",
  "currency": "INR",
  "taxCalculationMethod": "progressive",
  "pfContributionPercent": 12,
  "esicContributionPercent": 0.75
}', 'Payroll policy configuration', 'payroll');