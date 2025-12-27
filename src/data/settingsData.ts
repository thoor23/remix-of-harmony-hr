import {
  CompanySettings,
  AttendanceSettings,
  NotificationSettings,
  SystemPreferences,
  Role,
} from '@/types/settings';

export const defaultCompanySettings: CompanySettings = {
  companyName: 'TechCorp Inc.',
  address: '123 Business Park, San Francisco, CA 94102',
  phone: '+1 (555) 000-0000',
  email: 'hr@techcorp.com',
  website: 'https://techcorp.com',
  timezone: 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  financialYearStart: 'January',
};

export const defaultAttendanceSettings: AttendanceSettings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  graceMinutes: 15,
  halfDayCutoff: '13:00',
  weekends: ['Saturday', 'Sunday'],
  allowOvertimeTracking: true,
  minHoursForFullDay: 8,
  autoCheckoutTime: '23:59',
};

export const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  leaveApprovalAlerts: true,
  attendanceReminders: true,
  birthdayAnnouncements: true,
  payslipNotifications: true,
  systemUpdates: false,
};

export const defaultSystemPreferences: SystemPreferences = {
  language: 'English',
  theme: 'system',
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
};

export const defaultRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Admin',
    description: 'Full system access with all permissions',
    userCount: 2,
    isSystem: true,
    permissions: [
      { module: 'Employees', create: true, read: true, update: true, delete: true },
      { module: 'Attendance', create: true, read: true, update: true, delete: true },
      { module: 'Leaves', create: true, read: true, update: true, delete: true },
      { module: 'Payroll', create: true, read: true, update: true, delete: true },
      { module: 'Documents', create: true, read: true, update: true, delete: true },
      { module: 'Reports', create: true, read: true, update: true, delete: true },
      { module: 'Settings', create: true, read: true, update: true, delete: true },
    ],
  },
  {
    id: 'role-2',
    name: 'HR Manager',
    description: 'Manage employees, leaves, and payroll',
    userCount: 5,
    permissions: [
      { module: 'Employees', create: true, read: true, update: true, delete: false },
      { module: 'Attendance', create: true, read: true, update: true, delete: false },
      { module: 'Leaves', create: true, read: true, update: true, delete: false },
      { module: 'Payroll', create: true, read: true, update: true, delete: false },
      { module: 'Documents', create: true, read: true, update: true, delete: false },
      { module: 'Reports', create: false, read: true, update: false, delete: false },
      { module: 'Settings', create: false, read: true, update: false, delete: false },
    ],
  },
  {
    id: 'role-3',
    name: 'Manager',
    description: 'Approve leaves, view team attendance',
    userCount: 12,
    permissions: [
      { module: 'Employees', create: false, read: true, update: false, delete: false },
      { module: 'Attendance', create: false, read: true, update: false, delete: false },
      { module: 'Leaves', create: false, read: true, update: true, delete: false },
      { module: 'Payroll', create: false, read: false, update: false, delete: false },
      { module: 'Documents', create: false, read: true, update: false, delete: false },
      { module: 'Reports', create: false, read: true, update: false, delete: false },
      { module: 'Settings', create: false, read: false, update: false, delete: false },
    ],
  },
  {
    id: 'role-4',
    name: 'Employee',
    description: 'Self-service access only',
    userCount: 105,
    isSystem: true,
    permissions: [
      { module: 'Employees', create: false, read: false, update: false, delete: false },
      { module: 'Attendance', create: true, read: true, update: false, delete: false },
      { module: 'Leaves', create: true, read: true, update: false, delete: false },
      { module: 'Payroll', create: false, read: true, update: false, delete: false },
      { module: 'Documents', create: false, read: true, update: false, delete: false },
      { module: 'Reports', create: false, read: false, update: false, delete: false },
      { module: 'Settings', create: false, read: false, update: false, delete: false },
    ],
  },
];

export const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export const dateFormats = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD-MMM-YYYY',
];

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Hindi',
];

export const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const modules = [
  'Employees',
  'Attendance',
  'Leaves',
  'Payroll',
  'Documents',
  'Reports',
  'Settings',
];
