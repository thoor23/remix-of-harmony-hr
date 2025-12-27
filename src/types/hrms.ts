// Employee Types
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: Department;
  designation: Designation;
  dateOfJoining: string;
  dateOfBirth: string;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  reportingTo?: string;
  address: Address;
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  documents: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'resume' | 'id-proof' | 'address-proof' | 'education' | 'experience' | 'other';
  url: string;
  uploadedAt: string;
}

// Department & Designation
export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  description?: string;
  employeeCount: number;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  level: number;
  departmentId?: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'on-leave' | 'holiday' | 'weekend';
  workHours?: number;
  overtime?: number;
  notes?: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
}

// Leave Types
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  maxDays: number;
  carryForward: boolean;
  encashable: boolean;
  description?: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  total: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  comments?: string;
}

// Payroll Types
export interface SalaryStructure {
  id: string;
  employeeId: string;
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  effectiveFrom: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  payPeriod: string;
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossEarnings: number;
  pf: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paidDays: number;
  lopDays: number;
  status: 'draft' | 'generated' | 'paid';
  generatedOn: string;
  paidOn?: string;
}

// Document Types
export interface PolicyDocument {
  id: string;
  title: string;
  category: 'hr-policy' | 'leave-policy' | 'code-of-conduct' | 'benefits' | 'other';
  description?: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  version: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'offer-letter' | 'experience-letter' | 'relieving-letter' | 'increment-letter' | 'warning-letter' | 'other';
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'policy-update' | 'holiday';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'department' | 'specific';
  departmentIds?: string[];
  publishedAt: string;
  expiresAt?: string;
  createdBy: string;
  isActive: boolean;
}

// Holiday Types
export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'regional' | 'company' | 'optional';
  description?: string;
}

// Helpdesk/Ticket Types
export interface Ticket {
  id: string;
  ticketNumber: string;
  employeeId: string;
  employeeName: string;
  category: 'payroll' | 'leave' | 'attendance' | 'documents' | 'benefits' | 'other';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'employee' | 'hr';
  message: string;
  createdAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  performedBy: string;
  performedByName: string;
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  avatar?: string;
  employeeId?: string;
  permissions: string[];
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  todayAttendance: number;
  attendancePercentage: number;
  newJoinersThisMonth: number;
  upcomingBirthdays: { employeeId: string; name: string; date: string }[];
  recentAnnouncements: Announcement[];
  departmentWiseCount: { department: string; count: number }[];
}

export interface EmployeeDashboardStats {
  leaveBalance: LeaveBalance[];
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    leaves: number;
  };
  upcomingHolidays: Holiday[];
  pendingRequests: number;
  announcements: Announcement[];
}
