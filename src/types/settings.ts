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

// Shift Management Types
export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  gracePeriod: number;
  isNightShift: boolean;
  isFlexible: boolean;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  shiftId: string;
  shiftName: string;
  shiftColor: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface ShiftRotation {
  id: string;
  name: string;
  description: string;
  rotationPattern: string[];
  rotationFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  employeeIds: string[];
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
}
