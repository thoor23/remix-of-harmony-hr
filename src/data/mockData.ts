import {
  Employee,
  Department,
  Designation,
  AttendanceRecord,
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  Payslip,
  SalaryStructure,
  PolicyDocument,
  Announcement,
  Holiday,
  Ticket,
  AuditLog,
  DashboardStats,
  EmployeeDashboardStats,
} from '@/types/hrms';

// Departments
export const departments: Department[] = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', employeeCount: 45, description: 'Software Development & Engineering' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', employeeCount: 8, description: 'People & Culture' },
  { id: 'dept-3', name: 'Finance', code: 'FIN', employeeCount: 12, description: 'Finance & Accounting' },
  { id: 'dept-4', name: 'Marketing', code: 'MKT', employeeCount: 15, description: 'Marketing & Communications' },
  { id: 'dept-5', name: 'Sales', code: 'SALES', employeeCount: 20, description: 'Sales & Business Development' },
  { id: 'dept-6', name: 'Product', code: 'PROD', employeeCount: 10, description: 'Product Management' },
  { id: 'dept-7', name: 'Design', code: 'DES', employeeCount: 8, description: 'UI/UX Design' },
  { id: 'dept-8', name: 'Operations', code: 'OPS', employeeCount: 6, description: 'Operations & Admin' },
];

// Designations
export const designations: Designation[] = [
  { id: 'des-1', name: 'Software Engineer', code: 'SWE', level: 1 },
  { id: 'des-2', name: 'Senior Software Engineer', code: 'SSE', level: 2 },
  { id: 'des-3', name: 'Tech Lead', code: 'TL', level: 3 },
  { id: 'des-4', name: 'Engineering Manager', code: 'EM', level: 4 },
  { id: 'des-5', name: 'HR Executive', code: 'HRE', level: 1 },
  { id: 'des-6', name: 'HR Manager', code: 'HRM', level: 3 },
  { id: 'des-7', name: 'Accountant', code: 'ACC', level: 1 },
  { id: 'des-8', name: 'Finance Manager', code: 'FM', level: 3 },
  { id: 'des-9', name: 'Marketing Executive', code: 'ME', level: 1 },
  { id: 'des-10', name: 'Marketing Manager', code: 'MM', level: 3 },
  { id: 'des-11', name: 'Product Manager', code: 'PM', level: 3 },
  { id: 'des-12', name: 'UI/UX Designer', code: 'UXD', level: 2 },
];

// Employees
export const employees: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    department: departments[0],
    designation: designations[3],
    dateOfJoining: '2020-03-15',
    dateOfBirth: '1988-07-22',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '123 Tech Lane', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94102' },
    emergencyContact: { name: 'Jane Smith', relationship: 'Spouse', phone: '+1 (555) 987-6543' },
    bankDetails: { bankName: 'Chase Bank', accountNumber: '****4567', ifscCode: 'CHASE001', accountHolderName: 'John Smith' },
    documents: [],
    createdAt: '2020-03-15T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'emp-2',
    employeeId: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    department: departments[1],
    designation: designations[5],
    dateOfJoining: '2019-06-01',
    dateOfBirth: '1990-03-15',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '456 HR Street', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94103' },
    emergencyContact: { name: 'Mike Johnson', relationship: 'Brother', phone: '+1 (555) 876-5432' },
    bankDetails: { bankName: 'Bank of America', accountNumber: '****5678', ifscCode: 'BOA001', accountHolderName: 'Sarah Johnson' },
    documents: [],
    createdAt: '2019-06-01T09:00:00Z',
    updatedAt: '2024-01-10T14:20:00Z',
  },
  {
    id: 'emp-3',
    employeeId: 'EMP003',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@company.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    department: departments[0],
    designation: designations[1],
    dateOfJoining: '2022-01-10',
    dateOfBirth: '1995-11-08',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '789 Dev Ave', city: 'San Jose', state: 'CA', country: 'USA', zipCode: '95101' },
    emergencyContact: { name: 'Lisa Chen', relationship: 'Mother', phone: '+1 (555) 765-4321' },
    bankDetails: { bankName: 'Wells Fargo', accountNumber: '****6789', ifscCode: 'WF001', accountHolderName: 'Michael Chen' },
    documents: [],
    createdAt: '2022-01-10T09:00:00Z',
    updatedAt: '2024-01-12T11:45:00Z',
  },
  {
    id: 'emp-4',
    employeeId: 'EMP004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@company.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    department: departments[3],
    designation: designations[9],
    dateOfJoining: '2021-08-20',
    dateOfBirth: '1992-05-30',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '321 Marketing Blvd', city: 'Palo Alto', state: 'CA', country: 'USA', zipCode: '94301' },
    emergencyContact: { name: 'Tom Davis', relationship: 'Father', phone: '+1 (555) 654-3210' },
    bankDetails: { bankName: 'Citibank', accountNumber: '****7890', ifscCode: 'CITI001', accountHolderName: 'Emily Davis' },
    documents: [],
    createdAt: '2021-08-20T09:00:00Z',
    updatedAt: '2024-01-08T16:00:00Z',
  },
  {
    id: 'emp-5',
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@company.com',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    department: departments[2],
    designation: designations[7],
    dateOfJoining: '2018-11-05',
    dateOfBirth: '1985-09-12',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '654 Finance St', city: 'Oakland', state: 'CA', country: 'USA', zipCode: '94601' },
    emergencyContact: { name: 'Mary Wilson', relationship: 'Spouse', phone: '+1 (555) 543-2109' },
    bankDetails: { bankName: 'US Bank', accountNumber: '****8901', ifscCode: 'USB001', accountHolderName: 'David Wilson' },
    documents: [],
    createdAt: '2018-11-05T09:00:00Z',
    updatedAt: '2024-01-05T09:30:00Z',
  },
  {
    id: 'emp-6',
    employeeId: 'EMP006',
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.brown@company.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    department: departments[5],
    designation: designations[10],
    dateOfJoining: '2023-02-14',
    dateOfBirth: '1993-12-25',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '987 Product Lane', city: 'Mountain View', state: 'CA', country: 'USA', zipCode: '94040' },
    emergencyContact: { name: 'Robert Brown', relationship: 'Father', phone: '+1 (555) 432-1098' },
    bankDetails: { bankName: 'PNC Bank', accountNumber: '****9012', ifscCode: 'PNC001', accountHolderName: 'Amanda Brown' },
    documents: [],
    createdAt: '2023-02-14T09:00:00Z',
    updatedAt: '2024-01-14T13:15:00Z',
  },
  {
    id: 'emp-7',
    employeeId: 'EMP007',
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@company.com',
    phone: '+1 (555) 789-0123',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    department: departments[0],
    designation: designations[2],
    dateOfJoining: '2021-05-03',
    dateOfBirth: '1991-04-18',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '147 Tech Park', city: 'Sunnyvale', state: 'CA', country: 'USA', zipCode: '94085' },
    emergencyContact: { name: 'Nancy Taylor', relationship: 'Mother', phone: '+1 (555) 321-0987' },
    bankDetails: { bankName: 'TD Bank', accountNumber: '****0123', ifscCode: 'TD001', accountHolderName: 'James Taylor' },
    documents: [],
    createdAt: '2021-05-03T09:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
  },
  {
    id: 'emp-8',
    employeeId: 'EMP008',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.martinez@company.com',
    phone: '+1 (555) 890-1234',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    department: departments[6],
    designation: designations[11],
    dateOfJoining: '2022-07-18',
    dateOfBirth: '1994-08-05',
    status: 'on-leave',
    employmentType: 'full-time',
    address: { street: '258 Design Ave', city: 'Berkeley', state: 'CA', country: 'USA', zipCode: '94704' },
    emergencyContact: { name: 'Carlos Martinez', relationship: 'Brother', phone: '+1 (555) 210-9876' },
    bankDetails: { bankName: 'Capital One', accountNumber: '****1234', ifscCode: 'CAP001', accountHolderName: 'Jessica Martinez' },
    documents: [],
    createdAt: '2022-07-18T09:00:00Z',
    updatedAt: '2024-01-13T15:30:00Z',
  },
  {
    id: 'emp-9',
    employeeId: 'EMP009',
    firstName: 'Robert',
    lastName: 'Anderson',
    email: 'robert.anderson@company.com',
    phone: '+1 (555) 901-2345',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    department: departments[4],
    designation: designations[0],
    dateOfJoining: '2023-09-01',
    dateOfBirth: '1996-02-28',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '369 Sales Drive', city: 'Fremont', state: 'CA', country: 'USA', zipCode: '94536' },
    emergencyContact: { name: 'Linda Anderson', relationship: 'Spouse', phone: '+1 (555) 109-8765' },
    bankDetails: { bankName: 'Ally Bank', accountNumber: '****2345', ifscCode: 'ALLY001', accountHolderName: 'Robert Anderson' },
    documents: [],
    createdAt: '2023-09-01T09:00:00Z',
    updatedAt: '2024-01-09T11:20:00Z',
  },
  {
    id: 'emp-10',
    employeeId: 'EMP010',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.thompson@company.com',
    phone: '+1 (555) 012-3456',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    department: departments[7],
    designation: designations[4],
    dateOfJoining: '2020-10-12',
    dateOfBirth: '1989-06-17',
    status: 'active',
    employmentType: 'full-time',
    address: { street: '741 Operations Blvd', city: 'Redwood City', state: 'CA', country: 'USA', zipCode: '94061' },
    emergencyContact: { name: 'Mark Thompson', relationship: 'Spouse', phone: '+1 (555) 098-7654' },
    bankDetails: { bankName: 'Discover Bank', accountNumber: '****3456', ifscCode: 'DISC001', accountHolderName: 'Lisa Thompson' },
    documents: [],
    createdAt: '2020-10-12T09:00:00Z',
    updatedAt: '2024-01-07T14:45:00Z',
  },
];

// Leave Types
export const leaveTypes: LeaveType[] = [
  { id: 'lt-1', name: 'Casual Leave', code: 'CL', color: '#10B981', maxDays: 12, carryForward: false, encashable: false },
  { id: 'lt-2', name: 'Sick Leave', code: 'SL', color: '#F59E0B', maxDays: 10, carryForward: true, encashable: false },
  { id: 'lt-3', name: 'Earned Leave', code: 'EL', color: '#3B82F6', maxDays: 15, carryForward: true, encashable: true },
  { id: 'lt-4', name: 'Maternity Leave', code: 'ML', color: '#EC4899', maxDays: 180, carryForward: false, encashable: false },
  { id: 'lt-5', name: 'Paternity Leave', code: 'PL', color: '#8B5CF6', maxDays: 15, carryForward: false, encashable: false },
  { id: 'lt-6', name: 'Compensatory Off', code: 'CO', color: '#06B6D4', maxDays: 5, carryForward: false, encashable: false },
];

// Leave Requests
export const leaveRequests: LeaveRequest[] = [
  {
    id: 'lr-1',
    employeeId: 'emp-3',
    employeeName: 'Michael Chen',
    leaveTypeId: 'lt-1',
    leaveTypeName: 'Casual Leave',
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    days: 3,
    reason: 'Family function',
    status: 'pending',
    appliedOn: '2024-01-15T10:00:00Z',
  },
  {
    id: 'lr-2',
    employeeId: 'emp-4',
    employeeName: 'Emily Davis',
    leaveTypeId: 'lt-2',
    leaveTypeName: 'Sick Leave',
    startDate: '2024-01-18',
    endDate: '2024-01-19',
    days: 2,
    reason: 'Not feeling well',
    status: 'pending',
    appliedOn: '2024-01-17T09:30:00Z',
  },
  {
    id: 'lr-3',
    employeeId: 'emp-7',
    employeeName: 'James Taylor',
    leaveTypeId: 'lt-3',
    leaveTypeName: 'Earned Leave',
    startDate: '2024-02-01',
    endDate: '2024-02-10',
    days: 8,
    reason: 'Vacation trip',
    status: 'approved',
    appliedOn: '2024-01-10T11:00:00Z',
    approvedBy: 'emp-1',
    approvedOn: '2024-01-11T14:00:00Z',
  },
  {
    id: 'lr-4',
    employeeId: 'emp-8',
    employeeName: 'Jessica Martinez',
    leaveTypeId: 'lt-1',
    leaveTypeName: 'Casual Leave',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    days: 2,
    reason: 'Personal work',
    status: 'pending',
    appliedOn: '2024-01-16T08:00:00Z',
  },
  {
    id: 'lr-5',
    employeeId: 'emp-6',
    employeeName: 'Amanda Brown',
    leaveTypeId: 'lt-2',
    leaveTypeName: 'Sick Leave',
    startDate: '2024-01-10',
    endDate: '2024-01-11',
    days: 2,
    reason: 'Doctor appointment',
    status: 'rejected',
    appliedOn: '2024-01-08T15:00:00Z',
    approvedBy: 'emp-2',
    approvedOn: '2024-01-09T10:00:00Z',
    comments: 'Please provide medical certificate',
  },
];

// Leave Balances (for current employee)
export const leaveBalances: LeaveBalance[] = [
  { leaveTypeId: 'lt-1', total: 12, used: 4, pending: 2, available: 6 },
  { leaveTypeId: 'lt-2', total: 10, used: 2, pending: 0, available: 8 },
  { leaveTypeId: 'lt-3', total: 15, used: 5, pending: 0, available: 10 },
  { leaveTypeId: 'lt-6', total: 5, used: 1, pending: 0, available: 4 },
];

// Generate attendance records for the current month
const generateAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  employees.forEach((emp) => {
    for (let d = new Date(startOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        records.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status: 'weekend',
        });
      } else {
        const rand = Math.random();
        if (rand > 0.95) {
          records.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            status: 'absent',
          });
        } else if (rand > 0.9) {
          records.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            status: 'on-leave',
          });
        } else if (rand > 0.85) {
          records.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            checkIn: '10:15:00',
            checkOut: '18:30:00',
            status: 'late',
            workHours: 8.25,
          });
        } else {
          records.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            checkIn: '09:00:00',
            checkOut: '18:00:00',
            status: 'present',
            workHours: 9,
          });
        }
      }
    }
  });

  return records;
};

export const attendanceRecords: AttendanceRecord[] = generateAttendanceRecords();

// Payslips
export const payslips: Payslip[] = [
  {
    id: 'ps-1',
    employeeId: 'emp-3',
    employeeName: 'Michael Chen',
    month: 12,
    year: 2024,
    payPeriod: 'December 2024',
    basic: 50000,
    hra: 20000,
    conveyance: 3000,
    medicalAllowance: 2500,
    specialAllowance: 10000,
    otherAllowances: 2000,
    grossEarnings: 87500,
    pf: 6000,
    esi: 1313,
    professionalTax: 200,
    incomeTax: 8750,
    otherDeductions: 0,
    totalDeductions: 16263,
    netPay: 71237,
    paidDays: 31,
    lopDays: 0,
    status: 'paid',
    generatedOn: '2024-12-28T10:00:00Z',
    paidOn: '2024-12-31T12:00:00Z',
  },
  {
    id: 'ps-2',
    employeeId: 'emp-3',
    employeeName: 'Michael Chen',
    month: 11,
    year: 2024,
    payPeriod: 'November 2024',
    basic: 50000,
    hra: 20000,
    conveyance: 3000,
    medicalAllowance: 2500,
    specialAllowance: 10000,
    otherAllowances: 2000,
    grossEarnings: 87500,
    pf: 6000,
    esi: 1313,
    professionalTax: 200,
    incomeTax: 8750,
    otherDeductions: 0,
    totalDeductions: 16263,
    netPay: 71237,
    paidDays: 30,
    lopDays: 0,
    status: 'paid',
    generatedOn: '2024-11-28T10:00:00Z',
    paidOn: '2024-11-30T12:00:00Z',
  },
];

// Salary Structure
export const salaryStructures: SalaryStructure[] = [
  {
    id: 'ss-1',
    employeeId: 'emp-3',
    basic: 50000,
    hra: 20000,
    conveyance: 3000,
    medicalAllowance: 2500,
    specialAllowance: 10000,
    otherAllowances: 2000,
    grossSalary: 87500,
    pf: 6000,
    esi: 1313,
    professionalTax: 200,
    incomeTax: 8750,
    otherDeductions: 0,
    totalDeductions: 16263,
    netSalary: 71237,
    effectiveFrom: '2024-01-01',
  },
];

// Policy Documents
export const policyDocuments: PolicyDocument[] = [
  { id: 'pd-1', title: 'Employee Handbook 2024', category: 'hr-policy', description: 'Complete guide for all employees', url: '#', uploadedBy: 'emp-2', uploadedAt: '2024-01-01T09:00:00Z', version: '2.0' },
  { id: 'pd-2', title: 'Leave Policy', category: 'leave-policy', description: 'Guidelines for all types of leaves', url: '#', uploadedBy: 'emp-2', uploadedAt: '2024-01-01T09:00:00Z', version: '1.5' },
  { id: 'pd-3', title: 'Code of Conduct', category: 'code-of-conduct', description: 'Professional behavior guidelines', url: '#', uploadedBy: 'emp-2', uploadedAt: '2024-01-01T09:00:00Z', version: '1.2' },
  { id: 'pd-4', title: 'Health & Benefits Guide', category: 'benefits', description: 'Insurance and wellness programs', url: '#', uploadedBy: 'emp-2', uploadedAt: '2024-01-01T09:00:00Z', version: '1.0' },
  { id: 'pd-5', title: 'Remote Work Policy', category: 'hr-policy', description: 'Work from home guidelines', url: '#', uploadedBy: 'emp-2', uploadedAt: '2024-01-01T09:00:00Z', version: '1.1' },
];

// Announcements
export const announcements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'New Year Holiday Schedule',
    content: 'Please note that the office will be closed from December 31st to January 2nd for New Year celebrations. Happy Holidays!',
    type: 'holiday',
    priority: 'high',
    targetAudience: 'all',
    publishedAt: '2024-12-20T09:00:00Z',
    createdBy: 'emp-2',
    isActive: true,
  },
  {
    id: 'ann-2',
    title: 'Q1 2025 Town Hall Meeting',
    content: 'Join us for our quarterly town hall meeting on January 15th at 3:00 PM. We will discuss company updates, goals for Q1, and celebrate our achievements.',
    type: 'event',
    priority: 'medium',
    targetAudience: 'all',
    publishedAt: '2024-12-22T10:00:00Z',
    createdBy: 'emp-1',
    isActive: true,
  },
  {
    id: 'ann-3',
    title: 'Updated Leave Policy',
    content: 'We have updated our leave policy to include additional wellness days. Please review the new policy document in the Documents section.',
    type: 'policy-update',
    priority: 'medium',
    targetAudience: 'all',
    publishedAt: '2024-12-18T14:00:00Z',
    createdBy: 'emp-2',
    isActive: true,
  },
  {
    id: 'ann-4',
    title: 'System Maintenance Notice',
    content: 'HRMS will undergo scheduled maintenance on January 5th from 2:00 AM to 6:00 AM EST. Please plan accordingly.',
    type: 'urgent',
    priority: 'high',
    targetAudience: 'all',
    publishedAt: '2024-12-24T11:00:00Z',
    createdBy: 'emp-1',
    isActive: true,
  },
];

// Holidays
export const holidays: Holiday[] = [
  { id: 'h-1', name: "New Year's Day", date: '2025-01-01', type: 'national' },
  { id: 'h-2', name: 'Martin Luther King Jr. Day', date: '2025-01-20', type: 'national' },
  { id: 'h-3', name: "Presidents' Day", date: '2025-02-17', type: 'national' },
  { id: 'h-4', name: 'Memorial Day', date: '2025-05-26', type: 'national' },
  { id: 'h-5', name: 'Independence Day', date: '2025-07-04', type: 'national' },
  { id: 'h-6', name: 'Labor Day', date: '2025-09-01', type: 'national' },
  { id: 'h-7', name: 'Thanksgiving Day', date: '2025-11-27', type: 'national' },
  { id: 'h-8', name: 'Christmas Day', date: '2025-12-25', type: 'national' },
  { id: 'h-9', name: 'Company Foundation Day', date: '2025-03-15', type: 'company' },
  { id: 'h-10', name: 'Diwali', date: '2025-10-20', type: 'optional' },
];

// Tickets
export const tickets: Ticket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2024-001',
    employeeId: 'emp-3',
    employeeName: 'Michael Chen',
    category: 'payroll',
    subject: 'Salary discrepancy in December payslip',
    description: 'I noticed that my December payslip shows incorrect overtime hours. I worked 12 extra hours but only 8 are recorded.',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'emp-2',
    createdAt: '2024-12-26T10:00:00Z',
    updatedAt: '2024-12-27T09:00:00Z',
    messages: [
      { id: 'msg-1', senderId: 'emp-3', senderName: 'Michael Chen', senderRole: 'employee', message: 'I noticed that my December payslip shows incorrect overtime hours.', createdAt: '2024-12-26T10:00:00Z' },
      { id: 'msg-2', senderId: 'emp-2', senderName: 'Sarah Johnson', senderRole: 'hr', message: 'We are looking into this issue. Can you please share your timesheet for December?', createdAt: '2024-12-27T09:00:00Z' },
    ],
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TKT-2024-002',
    employeeId: 'emp-6',
    employeeName: 'Amanda Brown',
    category: 'documents',
    subject: 'Request for experience letter',
    description: 'I need an experience letter for visa application. Could you please provide it within this week?',
    priority: 'medium',
    status: 'open',
    createdAt: '2024-12-25T14:00:00Z',
    updatedAt: '2024-12-25T14:00:00Z',
    messages: [
      { id: 'msg-3', senderId: 'emp-6', senderName: 'Amanda Brown', senderRole: 'employee', message: 'I need an experience letter for visa application.', createdAt: '2024-12-25T14:00:00Z' },
    ],
  },
];

// Audit Logs
export const auditLogs: AuditLog[] = [
  { id: 'log-1', action: 'CREATE', module: 'Employee', description: 'Created new employee: Robert Anderson (EMP009)', performedBy: 'emp-2', performedByName: 'Sarah Johnson', ipAddress: '192.168.1.100', timestamp: '2023-09-01T09:00:00Z' },
  { id: 'log-2', action: 'UPDATE', module: 'Leave', description: 'Approved leave request for James Taylor', performedBy: 'emp-1', performedByName: 'John Smith', ipAddress: '192.168.1.101', timestamp: '2024-01-11T14:00:00Z' },
  { id: 'log-3', action: 'UPDATE', module: 'Payroll', description: 'Generated payslips for December 2024', performedBy: 'emp-5', performedByName: 'David Wilson', ipAddress: '192.168.1.102', timestamp: '2024-12-28T10:00:00Z' },
  { id: 'log-4', action: 'CREATE', module: 'Announcement', description: 'Published: New Year Holiday Schedule', performedBy: 'emp-2', performedByName: 'Sarah Johnson', ipAddress: '192.168.1.100', timestamp: '2024-12-20T09:00:00Z' },
  { id: 'log-5', action: 'DELETE', module: 'Document', description: 'Deleted outdated policy document: Old Handbook v1.0', performedBy: 'emp-2', performedByName: 'Sarah Johnson', ipAddress: '192.168.1.100', timestamp: '2024-12-15T11:30:00Z' },
  { id: 'log-6', action: 'UPDATE', module: 'Employee', description: 'Updated profile for Jessica Martinez', performedBy: 'emp-8', performedByName: 'Jessica Martinez', ipAddress: '192.168.1.105', timestamp: '2024-01-13T15:30:00Z' },
  { id: 'log-7', action: 'LOGIN', module: 'Auth', description: 'User logged in successfully', performedBy: 'emp-1', performedByName: 'John Smith', ipAddress: '192.168.1.101', timestamp: '2024-12-27T08:00:00Z' },
  { id: 'log-8', action: 'UPDATE', module: 'Settings', description: 'Updated department: Engineering', performedBy: 'emp-1', performedByName: 'John Smith', ipAddress: '192.168.1.101', timestamp: '2024-12-10T16:00:00Z' },
];

// Dashboard Stats
export const adminDashboardStats: DashboardStats = {
  totalEmployees: 124,
  activeEmployees: 118,
  pendingLeaveRequests: 4,
  todayAttendance: 102,
  attendancePercentage: 86.4,
  newJoinersThisMonth: 3,
  upcomingBirthdays: [
    { employeeId: 'emp-4', name: 'Emily Davis', date: '2024-01-28' },
    { employeeId: 'emp-9', name: 'Robert Anderson', date: '2024-02-02' },
  ],
  recentAnnouncements: announcements.slice(0, 3),
  departmentWiseCount: [
    { department: 'Engineering', count: 45 },
    { department: 'Sales', count: 20 },
    { department: 'Marketing', count: 15 },
    { department: 'Finance', count: 12 },
    { department: 'Product', count: 10 },
    { department: 'Human Resources', count: 8 },
    { department: 'Design', count: 8 },
    { department: 'Operations', count: 6 },
  ],
};

export const employeeDashboardStats: EmployeeDashboardStats = {
  leaveBalance: leaveBalances,
  attendanceSummary: {
    present: 18,
    absent: 1,
    late: 2,
    leaves: 1,
  },
  upcomingHolidays: holidays.slice(0, 3),
  pendingRequests: 1,
  announcements: announcements.slice(0, 3),
};

// Current User (for demo)
export const currentUser = {
  id: 'emp-3',
  email: 'michael.chen@company.com',
  name: 'Michael Chen',
  role: 'employee' as const,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  employeeId: 'emp-3',
  permissions: ['view-profile', 'apply-leave', 'view-attendance', 'view-payslip', 'view-documents', 'create-ticket'],
};

export const adminUser = {
  id: 'emp-2',
  email: 'sarah.johnson@company.com',
  name: 'Sarah Johnson',
  role: 'admin' as const,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  employeeId: 'emp-2',
  permissions: ['*'],
};
