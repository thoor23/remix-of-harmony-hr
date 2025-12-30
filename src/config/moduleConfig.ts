// Module configuration for RBAC system
// Maps modules to routes and icons for both Admin and Employee panels

import {
  LayoutDashboard,
  Users,
  Users2,
  Fingerprint,
  CalendarOff,
  TimerReset,
  Banknote,
  FolderOpen,
  Package,
  MapPin,
  Headset,
  BellRing,
  BarChart3,
  ScrollText,
  Settings2,
  LayoutTemplate,
  User,
  Receipt,
  Clock,
  HelpCircle,
  FileText,
  Wallet,
  CalendarCheck,
  CalendarDays,
} from "lucide-react";

export interface ModuleConfig {
  name: string;
  routes: string[];
  icon: React.ElementType;
  category: 'admin' | 'employee';
  description: string;
}

// Admin Panel Modules
export const adminModuleConfig: Record<string, ModuleConfig> = {
  'Admin Dashboard': {
    name: 'Admin Dashboard',
    routes: ['/admin'],
    icon: LayoutDashboard,
    category: 'admin',
    description: 'Main admin dashboard access',
  },
  'Employees': {
    name: 'Employees',
    routes: ['/admin/employees'],
    icon: Users,
    category: 'admin',
    description: 'Employee management and directory',
  },
  'Attendance': {
    name: 'Attendance',
    routes: ['/admin/attendance'],
    icon: Fingerprint,
    category: 'admin',
    description: 'Attendance tracking and regularization',
  },
  'Leaves': {
    name: 'Leaves',
    routes: ['/admin/leaves'],
    icon: CalendarOff,
    category: 'admin',
    description: 'Leave management and policies',
  },
  'Shifts': {
    name: 'Shifts',
    routes: ['/admin/shifts'],
    icon: TimerReset,
    category: 'admin',
    description: 'Shift scheduling and rotations',
  },
  'Payroll': {
    name: 'Payroll',
    routes: ['/admin/payroll'],
    icon: Banknote,
    category: 'admin',
    description: 'Salary and payslip management',
  },
  'Documents': {
    name: 'Documents',
    routes: ['/admin/file-manager', '/admin/letters'],
    icon: FolderOpen,
    category: 'admin',
    description: 'Document and letter management',
  },
  'Assets': {
    name: 'Assets',
    routes: ['/admin/assets'],
    icon: Package,
    category: 'admin',
    description: 'Asset inventory and assignments',
  },
  'Locations': {
    name: 'Locations',
    routes: ['/admin/locations'],
    icon: MapPin,
    category: 'admin',
    description: 'Stores, offices, and transfers',
  },
  'Helpdesk': {
    name: 'Helpdesk',
    routes: ['/admin/helpdesk'],
    icon: Headset,
    category: 'admin',
    description: 'Support ticket management',
  },
  'Announcements': {
    name: 'Announcements',
    routes: ['/admin/announcements', '/admin/notifications'],
    icon: BellRing,
    category: 'admin',
    description: 'Announcements and notifications',
  },
  'Reports': {
    name: 'Reports',
    routes: ['/admin/reports'],
    icon: BarChart3,
    category: 'admin',
    description: 'Reports and analytics',
  },
  'Audit Logs': {
    name: 'Audit Logs',
    routes: ['/admin/audit-logs'],
    icon: ScrollText,
    category: 'admin',
    description: 'System audit trail',
  },
  'Settings': {
    name: 'Settings',
    routes: ['/admin/settings'],
    icon: Settings2,
    category: 'admin',
    description: 'System configuration',
  },
  'Templates': {
    name: 'Templates',
    routes: ['/admin/payroll/templates', '/admin/letters/templates', '/admin/announcements/templates', '/admin/announcements/banner-templates', '/admin/settings/email-templates'],
    icon: LayoutTemplate,
    category: 'admin',
    description: 'All template management',
  },
};

// Employee Panel Modules
export const employeeModuleConfig: Record<string, ModuleConfig> = {
  'Employee Dashboard': {
    name: 'Employee Dashboard',
    routes: ['/employee'],
    icon: LayoutDashboard,
    category: 'employee',
    description: 'Employee self-service dashboard',
  },
  'My Attendance': {
    name: 'My Attendance',
    routes: ['/employee/attendance'],
    icon: Fingerprint,
    category: 'employee',
    description: 'Personal attendance records',
  },
  'My Shifts': {
    name: 'My Shifts',
    routes: ['/employee/shifts', '/employee/all-shifts', '/employee/shift-exchange'],
    icon: Clock,
    category: 'employee',
    description: 'Personal shift schedule',
  },
  'My Leaves': {
    name: 'My Leaves',
    routes: ['/employee/leaves'],
    icon: CalendarCheck,
    category: 'employee',
    description: 'Personal leave management',
  },
  'My Payslips': {
    name: 'My Payslips',
    routes: ['/employee/payslips', '/employee/payroll'],
    icon: Receipt,
    category: 'employee',
    description: 'Personal payslips',
  },
  'My Documents': {
    name: 'My Documents',
    routes: ['/employee/documents'],
    icon: FileText,
    category: 'employee',
    description: 'Personal documents',
  },
  'My Assets': {
    name: 'My Assets',
    routes: ['/employee/assets'],
    icon: Package,
    category: 'employee',
    description: 'Assigned assets',
  },
  'My Helpdesk': {
    name: 'My Helpdesk',
    routes: ['/employee/helpdesk'],
    icon: HelpCircle,
    category: 'employee',
    description: 'Personal support tickets',
  },
  'My Profile': {
    name: 'My Profile',
    routes: ['/employee/profile'],
    icon: User,
    category: 'employee',
    description: 'Profile management',
  },
  'My Settings': {
    name: 'My Settings',
    routes: ['/employee/settings'],
    icon: Settings2,
    category: 'employee',
    description: 'Personal settings',
  },
  'My Reports': {
    name: 'My Reports',
    routes: [
      '/employee/attendance/report',
      '/employee/shifts/report',
      '/employee/leaves/report',
      '/employee/payroll/report',
      '/employee/helpdesk/report',
    ],
    icon: BarChart3,
    category: 'employee',
    description: 'Personal reports',
  },
};

// All modules combined
export const allModules = { ...adminModuleConfig, ...employeeModuleConfig };

// Get all module names
export const adminModuleNames = Object.keys(adminModuleConfig);
export const employeeModuleNames = Object.keys(employeeModuleConfig);
export const allModuleNames = [...adminModuleNames, ...employeeModuleNames];

// Find module for a given route
export function getModuleForRoute(route: string): string | null {
  // Check admin modules
  for (const [moduleName, config] of Object.entries(adminModuleConfig)) {
    if (config.routes.some(r => route === r || route.startsWith(r + '/'))) {
      return moduleName;
    }
  }
  
  // Check employee modules
  for (const [moduleName, config] of Object.entries(employeeModuleConfig)) {
    if (config.routes.some(r => route === r || route.startsWith(r + '/'))) {
      return moduleName;
    }
  }
  
  return null;
}

// Get default permissions for all modules
export function getDefaultPermissions(panel: 'admin' | 'employee' | 'all' = 'all') {
  const modules = panel === 'admin' 
    ? adminModuleNames 
    : panel === 'employee' 
      ? employeeModuleNames 
      : allModuleNames;
      
  return modules.map(module => ({
    module,
    create: false,
    read: true,
    update: false,
    delete: false,
  }));
}

// Check if a module belongs to admin panel
export function isAdminModule(module: string): boolean {
  return module in adminModuleConfig;
}

// Check if a module belongs to employee panel
export function isEmployeeModule(module: string): boolean {
  return module in employeeModuleConfig;
}
