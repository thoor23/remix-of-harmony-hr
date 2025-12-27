// Settings Types

export interface CompanySettings {
  companyName: string;
  companyLogo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  financialYearStart: string;
}

export interface AttendanceSettings {
  workStartTime: string;
  workEndTime: string;
  graceMinutes: number;
  halfDayCutoff: string;
  weekends: string[];
  allowOvertimeTracking: boolean;
  minHoursForFullDay: number;
  autoCheckoutTime?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  leaveApprovalAlerts: boolean;
  attendanceReminders: boolean;
  birthdayAnnouncements: boolean;
  payslipNotifications: boolean;
  systemUpdates: boolean;
}

export interface SystemPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
}

export interface RolePermission {
  module: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: RolePermission[];
  isSystem?: boolean;
}
