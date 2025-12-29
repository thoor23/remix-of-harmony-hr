import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Password hashing (same as api-auth)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

// Indian first names
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advait', 'Aarush', 'Kabir', 'Ritvik', 'Anirudh', 'Dhruv',
  'Anaya', 'Aanya', 'Aadhya', 'Aaradhya', 'Anvi', 'Pari', 'Anika', 'Navya', 'Diya', 'Myra',
  'Sara', 'Priya', 'Riya', 'Shreya', 'Neha', 'Pooja', 'Meera', 'Kavya', 'Isha', 'Tanvi',
  'Raj', 'Rohit', 'Amit', 'Suresh', 'Rahul', 'Vikram', 'Ajay', 'Deepak', 'Nikhil', 'Karan'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Shah', 'Joshi', 'Mehta', 'Iyer',
  'Nair', 'Rao', 'Reddy', 'Pillai', 'Menon', 'Choudhary', 'Agarwal', 'Bansal', 'Kapoor', 'Malhotra',
  'Saxena', 'Bhatia', 'Arora', 'Khanna', 'Chopra', 'Sinha', 'Mishra', 'Pandey', 'Tiwari', 'Dubey'
];

// Department and designation data
const departments = [
  { name: 'Engineering', code: 'ENG', description: 'Software development and technology' },
  { name: 'Sales', code: 'SALES', description: 'Sales and business development' },
  { name: 'Marketing', code: 'MKT', description: 'Marketing and brand management' },
  { name: 'Product', code: 'PROD', description: 'Product management and strategy' },
  { name: 'Human Resources', code: 'HR', description: 'Human resources and recruitment' },
  { name: 'Finance', code: 'FIN', description: 'Finance and accounting' },
  { name: 'Design', code: 'DES', description: 'UI/UX and graphic design' },
  { name: 'Operations', code: 'OPS', description: 'Operations and administration' }
];

const designations = [
  // Engineering
  { name: 'Junior Software Engineer', code: 'JSE', level: 1, department: 'Engineering' },
  { name: 'Software Engineer', code: 'SE', level: 2, department: 'Engineering' },
  { name: 'Senior Software Engineer', code: 'SSE', level: 3, department: 'Engineering' },
  { name: 'Tech Lead', code: 'TL', level: 4, department: 'Engineering' },
  { name: 'Engineering Manager', code: 'EM', level: 5, department: 'Engineering' },
  // Sales
  { name: 'Sales Executive', code: 'SX', level: 2, department: 'Sales' },
  { name: 'Senior Sales Executive', code: 'SSX', level: 3, department: 'Sales' },
  { name: 'Sales Manager', code: 'SM', level: 4, department: 'Sales' },
  // Marketing
  { name: 'Marketing Executive', code: 'MX', level: 2, department: 'Marketing' },
  { name: 'Senior Marketing Executive', code: 'SMX', level: 3, department: 'Marketing' },
  { name: 'Marketing Manager', code: 'MM', level: 4, department: 'Marketing' },
  // Product
  { name: 'Associate Product Manager', code: 'APM', level: 2, department: 'Product' },
  { name: 'Product Manager', code: 'PM', level: 3, department: 'Product' },
  { name: 'Senior Product Manager', code: 'SPM', level: 4, department: 'Product' },
  // HR
  { name: 'HR Executive', code: 'HRE', level: 2, department: 'Human Resources' },
  { name: 'Senior HR Executive', code: 'SHRE', level: 3, department: 'Human Resources' },
  { name: 'HR Manager', code: 'HRM', level: 4, department: 'Human Resources' },
  // Finance
  { name: 'Accountant', code: 'ACC', level: 2, department: 'Finance' },
  { name: 'Senior Accountant', code: 'SACC', level: 3, department: 'Finance' },
  { name: 'Finance Manager', code: 'FM', level: 4, department: 'Finance' },
  // Design
  { name: 'UI/UX Designer', code: 'UID', level: 2, department: 'Design' },
  { name: 'Senior UI/UX Designer', code: 'SUID', level: 3, department: 'Design' },
  { name: 'Design Lead', code: 'DL', level: 4, department: 'Design' },
  // Operations
  { name: 'Operations Executive', code: 'OE', level: 2, department: 'Operations' },
  { name: 'Operations Manager', code: 'OM', level: 4, department: 'Operations' }
];

const leaveTypes = [
  { name: 'Casual Leave', code: 'CL', max_days: 12, color: '#3B82F6', carry_forward: false, encashable: false },
  { name: 'Sick Leave', code: 'SL', max_days: 10, color: '#EF4444', carry_forward: false, encashable: false },
  { name: 'Earned Leave', code: 'EL', max_days: 15, color: '#10B981', carry_forward: true, encashable: true },
  { name: 'Maternity Leave', code: 'ML', max_days: 180, color: '#EC4899', carry_forward: false, encashable: false },
  { name: 'Paternity Leave', code: 'PL', max_days: 15, color: '#8B5CF6', carry_forward: false, encashable: false },
  { name: 'Compensatory Off', code: 'CO', max_days: 5, color: '#F59E0B', carry_forward: false, encashable: false }
];

const shifts = [
  { name: 'Day Shift', code: 'DAY', start_time: '09:00', end_time: '18:00', break_duration: 60, color: '#3B82F6' },
  { name: 'Morning Shift', code: 'MOR', start_time: '07:00', end_time: '16:00', break_duration: 60, color: '#10B981' },
  { name: 'Evening Shift', code: 'EVE', start_time: '14:00', end_time: '23:00', break_duration: 60, color: '#F59E0B' },
  { name: 'Flexible', code: 'FLEX', start_time: '10:00', end_time: '19:00', break_duration: 60, color: '#8B5CF6' }
];

const holidays2025 = [
  { name: 'New Year', date: '2025-01-01', type: 'public', description: 'New Year Day' },
  { name: 'Republic Day', date: '2025-01-26', type: 'national', description: 'Republic Day of India' },
  { name: 'Holi', date: '2025-03-14', type: 'public', description: 'Festival of Colors' },
  { name: 'Good Friday', date: '2025-04-18', type: 'public', description: 'Good Friday' },
  { name: 'Eid ul-Fitr', date: '2025-03-31', type: 'public', description: 'End of Ramadan' },
  { name: 'Labour Day', date: '2025-05-01', type: 'public', description: 'International Workers Day' },
  { name: 'Independence Day', date: '2025-08-15', type: 'national', description: 'Independence Day of India' },
  { name: 'Janmashtami', date: '2025-08-16', type: 'public', description: 'Birth of Lord Krishna' },
  { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'national', description: 'Birth anniversary of Mahatma Gandhi' },
  { name: 'Dussehra', date: '2025-10-02', type: 'public', description: 'Victory of good over evil' },
  { name: 'Diwali', date: '2025-10-20', type: 'public', description: 'Festival of Lights' },
  { name: 'Diwali Holiday', date: '2025-10-21', type: 'public', description: 'Day after Diwali' },
  { name: 'Guru Nanak Jayanti', date: '2025-11-05', type: 'public', description: 'Birth of Guru Nanak' },
  { name: 'Christmas', date: '2025-12-25', type: 'public', description: 'Christmas Day' },
  { name: 'Company Foundation Day', date: '2025-06-15', type: 'company', description: 'Company Anniversary', is_optional: true }
];

// Locations data (Stores + Offices)
const locations = [
  // Indian Stores
  { name: 'Mumbai Retail Store', code: 'MUM-STR-01', type: 'store', address_street: 'Shop 12, Phoenix Mall', address_city: 'Mumbai', address_state: 'Maharashtra', address_country: 'India', address_zip_code: '400001', phone: '+91 22 2222 1111', email: 'mumbai.store@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '10:00', closing_time: '21:00' },
  { name: 'Delhi Flagship Store', code: 'DEL-STR-01', type: 'store', address_street: 'Level 2, Select Citywalk', address_city: 'New Delhi', address_state: 'Delhi', address_country: 'India', address_zip_code: '110017', phone: '+91 11 4444 5555', email: 'delhi.store@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '10:00', closing_time: '21:00' },
  { name: 'Bangalore Mall Outlet', code: 'BLR-STR-01', type: 'store', address_street: 'UG Floor, Orion Mall', address_city: 'Bangalore', address_state: 'Karnataka', address_country: 'India', address_zip_code: '560055', phone: '+91 80 3333 4444', email: 'bangalore.store@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '10:00', closing_time: '21:00' },
  { name: 'Chennai Express Store', code: 'CHN-STR-01', type: 'store', address_street: 'Express Avenue Mall', address_city: 'Chennai', address_state: 'Tamil Nadu', address_country: 'India', address_zip_code: '600002', phone: '+91 44 2828 3939', email: 'chennai.store@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '10:00', closing_time: '21:00' },
  { name: 'Pune City Store', code: 'PUN-STR-01', type: 'store', address_street: 'Koregaon Park Plaza', address_city: 'Pune', address_state: 'Maharashtra', address_country: 'India', address_zip_code: '411001', phone: '+91 20 4545 6565', email: 'pune.store@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '10:00', closing_time: '21:00' },
  // USA Stores
  { name: 'New York Store', code: 'NY-STR-01', type: 'store', address_street: '350 5th Avenue', address_city: 'New York', address_state: 'New York', address_country: 'USA', address_zip_code: '10118', phone: '+1 212 555 1234', email: 'newyork.store@company.com', timezone: 'America/New_York', date_format: 'MM/DD/YYYY', currency: 'USD', locale: 'en-US', opening_time: '09:00', closing_time: '20:00' },
  { name: 'San Francisco Store', code: 'SF-STR-01', type: 'store', address_street: '865 Market Street', address_city: 'San Francisco', address_state: 'California', address_country: 'USA', address_zip_code: '94103', phone: '+1 415 555 5678', email: 'sf.store@company.com', timezone: 'America/Los_Angeles', date_format: 'MM/DD/YYYY', currency: 'USD', locale: 'en-US', opening_time: '09:00', closing_time: '20:00' },
  // Indian Offices
  { name: 'Mumbai Head Office', code: 'MUM-OFF-01', type: 'office', address_street: 'One World Centre, Tower 2', address_city: 'Mumbai', address_state: 'Maharashtra', address_country: 'India', address_zip_code: '400018', phone: '+91 22 6666 7777', email: 'mumbai.hq@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '09:00', closing_time: '18:00' },
  { name: 'Bangalore Tech Hub', code: 'BLR-OFF-01', type: 'office', address_street: 'Embassy Tech Village', address_city: 'Bangalore', address_state: 'Karnataka', address_country: 'India', address_zip_code: '560103', phone: '+91 80 4567 8901', email: 'bangalore.tech@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '09:00', closing_time: '18:00' },
  { name: 'Delhi Regional Office', code: 'DEL-OFF-01', type: 'office', address_street: 'DLF Cyber City', address_city: 'Gurugram', address_state: 'Haryana', address_country: 'India', address_zip_code: '122002', phone: '+91 124 4567 8900', email: 'delhi.regional@company.com', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY', currency: 'INR', locale: 'en-IN', opening_time: '09:00', closing_time: '18:00' },
  // USA Offices
  { name: 'New York Office', code: 'NY-OFF-01', type: 'office', address_street: '1 World Trade Center, Floor 85', address_city: 'New York', address_state: 'New York', address_country: 'USA', address_zip_code: '10007', phone: '+1 212 555 9999', email: 'newyork.office@company.com', timezone: 'America/New_York', date_format: 'MM/DD/YYYY', currency: 'USD', locale: 'en-US', opening_time: '08:00', closing_time: '17:00' },
  { name: 'San Francisco Tech Office', code: 'SF-OFF-01', type: 'office', address_street: '101 California Street', address_city: 'San Francisco', address_state: 'California', address_country: 'USA', address_zip_code: '94111', phone: '+1 415 555 8888', email: 'sf.tech@company.com', timezone: 'America/Los_Angeles', date_format: 'MM/DD/YYYY', currency: 'USD', locale: 'en-US', opening_time: '08:00', closing_time: '17:00' }
];

// Employee distribution plan with store_manager role included
const employeeDistribution = [
  { department: 'Engineering', count: 14, roles: ['employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'employee', 'manager', 'admin', 'employee'] },
  { department: 'Sales', count: 10, roles: ['employee', 'employee', 'employee', 'employee', 'employee', 'store_manager', 'store_manager', 'store_manager', 'store_manager', 'manager'] },
  { department: 'Marketing', count: 6, roles: ['employee', 'employee', 'employee', 'employee', 'employee', 'manager'] },
  { department: 'Product', count: 5, roles: ['employee', 'employee', 'employee', 'employee', 'manager'] },
  { department: 'Human Resources', count: 4, roles: ['hr', 'hr', 'employee', 'employee'] },
  { department: 'Finance', count: 5, roles: ['employee', 'employee', 'employee', 'employee', 'manager'] },
  { department: 'Design', count: 3, roles: ['employee', 'employee', 'employee'] },
  { department: 'Operations', count: 3, roles: ['employee', 'employee', 'admin'] }
];

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSalaryByLevel(level: number): { basic: number, hra: number, transport: number, medical: number, other: number, pf: number, tax: number } {
  const salaryRanges: Record<number, { min: number, max: number }> = {
    1: { min: 25000, max: 40000 },
    2: { min: 40000, max: 70000 },
    3: { min: 70000, max: 120000 },
    4: { min: 120000, max: 180000 },
    5: { min: 180000, max: 250000 }
  };
  
  const range = salaryRanges[level] || salaryRanges[2];
  const basic = Math.floor(Math.random() * (range.max - range.min) + range.min);
  
  return {
    basic,
    hra: Math.floor(basic * 0.4),
    transport: Math.floor(basic * 0.1),
    medical: Math.floor(basic * 0.05),
    other: Math.floor(basic * 0.1),
    pf: Math.floor(basic * 0.12),
    tax: Math.floor(basic * 0.1)
  };
}

const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'Maharashtra', 'West Bengal', 'Gujarat'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    console.log('Starting database seeding...');

    // Step 1: Clear existing data in order (including new tables)
    console.log('Clearing existing data...');
    const tablesToClear = [
      'asset_maintenance',
      'asset_transfers',
      'asset_assignments',
      'assets',
      'asset_categories',
      'ticket_messages',
      'helpdesk_tickets',
      'attendance_regularization_requests',
      'profile_change_requests',
      'payslips',
      'salary_structures',
      'leave_requests',
      'leave_balances',
      'shift_exchange_requests',
      'shift_assignments',
      'attendance_records',
      'generated_letters',
      'notifications',
      'targeted_notifications',
      'announcements',
      'documents',
      'employee_transfers',
      'employee_store_assignments',
      'employees',
      'stores',
      'profiles',
      'user_roles',
      'refresh_tokens',
      'users',
      'designations',
      'departments',
      'leave_types',
      'shifts',
      'holidays'
    ];

    for (const table of tablesToClear) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.log(`Note: Could not clear ${table}: ${error.message}`);
      } else {
        console.log(`Cleared ${table}`);
      }
    }

    // Step 2: Create departments
    console.log('Creating departments...');
    const { data: createdDepts, error: deptError } = await supabase
      .from('departments')
      .insert(departments.map(d => ({ ...d, employee_count: 0 })))
      .select();
    
    if (deptError) throw new Error(`Failed to create departments: ${deptError.message}`);
    console.log(`Created ${createdDepts?.length} departments`);

    const deptMap = new Map(createdDepts?.map(d => [d.name, d.id]) || []);

    // Step 3: Create designations
    console.log('Creating designations...');
    const designationsWithDeptId = designations.map(d => ({
      name: d.name,
      code: d.code,
      level: d.level,
      department_id: deptMap.get(d.department)
    }));

    const { data: createdDesignations, error: desigError } = await supabase
      .from('designations')
      .insert(designationsWithDeptId)
      .select();
    
    if (desigError) throw new Error(`Failed to create designations: ${desigError.message}`);
    console.log(`Created ${createdDesignations?.length} designations`);

    // Step 4: Create leave types
    console.log('Creating leave types...');
    const { data: createdLeaveTypes, error: ltError } = await supabase
      .from('leave_types')
      .insert(leaveTypes)
      .select();
    
    if (ltError) throw new Error(`Failed to create leave types: ${ltError.message}`);
    console.log(`Created ${createdLeaveTypes?.length} leave types`);

    // Step 5: Create shifts
    console.log('Creating shifts...');
    const { data: createdShifts, error: shiftError } = await supabase
      .from('shifts')
      .insert(shifts)
      .select();
    
    if (shiftError) throw new Error(`Failed to create shifts: ${shiftError.message}`);
    console.log(`Created ${createdShifts?.length} shifts`);

    // Step 6: Create holidays
    console.log('Creating holidays...');
    const { error: holidayError } = await supabase
      .from('holidays')
      .insert(holidays2025);
    
    if (holidayError) throw new Error(`Failed to create holidays: ${holidayError.message}`);
    console.log('Created holidays');

    // Step 7: Create locations (stores and offices)
    console.log('Creating locations (stores & offices)...');
    const { data: createdLocations, error: locError } = await supabase
      .from('stores')
      .insert(locations.map(loc => ({
        name: loc.name,
        code: loc.code,
        type: loc.type,
        address_street: loc.address_street,
        address_city: loc.address_city,
        address_state: loc.address_state,
        address_country: loc.address_country,
        address_zip_code: loc.address_zip_code,
        phone: loc.phone,
        email: loc.email,
        timezone: loc.timezone,
        date_format: loc.date_format,
        currency: loc.currency,
        locale: loc.locale,
        opening_time: loc.opening_time,
        closing_time: loc.closing_time,
        is_active: true
      })))
      .select();

    if (locError) throw new Error(`Failed to create locations: ${locError.message}`);
    console.log(`Created ${createdLocations?.length} locations`);

    const storeLocations = createdLocations?.filter(l => l.type === 'store') || [];
    const officeLocations = createdLocations?.filter(l => l.type === 'office') || [];

    // Step 8: Create password hash for all users
    console.log('Creating password hash...');
    const passwordHash = await hashPassword('Test@123');

    // Step 9: Create 50 employees with users, profiles, roles
    console.log('Creating employees...');
    const createdEmployees: Array<{
      id: string;
      userId: string;
      departmentId: string;
      designationId: string;
      designationLevel: number;
      joiningDate: string;
      role: string;
      locationId?: string;
    }> = [];

    let employeeCounter = 1;
    let adminCounter = 1;
    let hrCounter = 1;
    let storeManagerCounter = 0;
    const usedNames = new Set<string>();

    for (const dept of employeeDistribution) {
      const deptId = deptMap.get(dept.department);
      if (!deptId) continue;

      const deptDesignations = createdDesignations?.filter(d => d.department_id === deptId) || [];

      for (let i = 0; i < dept.count; i++) {
        const role = dept.roles[i] || 'employee';
        
        // Generate unique name
        let firstName: string, lastName: string, fullName: string;
        do {
          firstName = getRandomElement(firstNames);
          lastName = getRandomElement(lastNames);
          fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));
        usedNames.add(fullName);

        // Generate email based on role with separate counters
        let email: string;
        if (role === 'admin') {
          email = adminCounter === 1 ? 'admin@company.com' : `admin${adminCounter}@company.com`;
          adminCounter++;
        } else if (role === 'hr') {
          email = `hr${hrCounter}@company.com`;
          hrCounter++;
        } else if (role === 'manager') {
          email = `manager.${dept.department.toLowerCase().replace(' ', '')}@company.com`;
        } else if (role === 'store_manager') {
          storeManagerCounter++;
          email = `storemanager${storeManagerCounter}@company.com`;
        } else {
          email = `emp${String(employeeCounter).padStart(3, '0')}@company.com`;
          employeeCounter++;
        }

        // Assign location for store managers
        let primaryLocationId: string | undefined;
        if (role === 'store_manager' && storeLocations.length > 0) {
          primaryLocationId = storeLocations[(storeManagerCounter - 1) % storeLocations.length]?.id;
        }

        // Create user
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            email,
            password_hash: passwordHash,
            is_active: true,
            email_confirmed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (userError) {
          console.log(`Failed to create user ${email}: ${userError.message}`);
          continue;
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            department: dept.department,
            designation: deptDesignations[i % deptDesignations.length]?.name || 'Employee'
          });

        if (profileError) {
          console.log(`Failed to create profile: ${profileError.message}`);
        }

        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role
          });

        if (roleError) {
          console.log(`Failed to assign role: ${roleError.message}`);
        }

        // Pick designation based on level preference
        const designation = role === 'manager' || role === 'admin' || role === 'store_manager'
          ? deptDesignations.find(d => d.level >= 4) || deptDesignations[deptDesignations.length - 1]
          : deptDesignations[i % deptDesignations.length];

        // Generate employee data
        const joiningDate = getRandomDate(new Date('2020-01-01'), new Date('2024-06-01'));
        const dobYear = 1970 + Math.floor(Math.random() * 30);
        const dob = getRandomDate(new Date(`${dobYear}-01-01`), new Date(`${dobYear}-12-31`));
        const cityIdx = Math.floor(Math.random() * cities.length);

        // Assign a random location if not a store manager
        if (!primaryLocationId && createdLocations && createdLocations.length > 0) {
          primaryLocationId = getRandomElement(createdLocations).id;
        }

        const { data: employee, error: empError } = await supabase
          .from('employees')
          .insert({
            user_id: user.id,
            employee_id: `EMP${String(createdEmployees.length + 1).padStart(4, '0')}`,
            department_id: deptId,
            designation_id: designation?.id,
            date_of_birth: dob,
            date_of_joining: joiningDate,
            employment_type: Math.random() > 0.9 ? 'contract' : 'full-time',
            status: 'active',
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            address_street: `${Math.floor(Math.random() * 999) + 1}, ${getRandomElement(['MG Road', 'Park Street', 'Brigade Road', 'Anna Salai', 'FC Road'])}`,
            address_city: cities[cityIdx],
            address_state: states[cityIdx],
            address_country: 'India',
            address_zip_code: String(100000 + Math.floor(Math.random() * 899999)),
            bank_name: getRandomElement(banks),
            bank_account_number: `XXXX${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
            bank_ifsc_code: `${getRandomElement(['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK'])}0${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
            bank_account_holder_name: `${firstName} ${lastName}`,
            emergency_contact_name: `${getRandomElement(firstNames)} ${lastName}`,
            emergency_contact_phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            emergency_contact_relationship: getRandomElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
            primary_store_id: primaryLocationId
          })
          .select()
          .single();

        if (empError) {
          console.log(`Failed to create employee: ${empError.message}`);
          continue;
        }

        createdEmployees.push({
          id: employee.id,
          userId: user.id,
          departmentId: deptId,
          designationId: designation?.id,
          designationLevel: designation?.level || 2,
          joiningDate,
          role,
          locationId: primaryLocationId
        });

        console.log(`Created employee: ${firstName} ${lastName} (${email}) - ${role}`);
      }
    }

    console.log(`Total employees created: ${createdEmployees.length}`);

    // Step 10: Update store managers on locations
    console.log('Assigning store managers to locations...');
    const storeManagerEmployees = createdEmployees.filter(e => e.role === 'store_manager');
    for (let i = 0; i < storeManagerEmployees.length && i < storeLocations.length; i++) {
      const store = storeLocations[i];
      const manager = storeManagerEmployees[i];
      await supabase.from('stores').update({ manager_id: manager.id }).eq('id', store.id);
      console.log(`Assigned manager to ${store.name}`);
    }

    // Step 11: Create employee-location assignments
    console.log('Creating employee-location assignments...');
    for (const emp of createdEmployees) {
      if (emp.locationId) {
        await supabase.from('employee_store_assignments').insert({
          employee_id: emp.id,
          store_id: emp.locationId,
          is_primary: true,
          is_active: true,
          start_date: emp.joiningDate
        });
      }
    }
    console.log('Created employee-location assignments');

    // Step 12: Create employee transfers (sample transfers)
    console.log('Creating employee transfers...');
    const transferableEmployees = createdEmployees.filter(e => e.role === 'employee' && e.locationId);
    for (let i = 0; i < Math.min(10, transferableEmployees.length); i++) {
      const emp = transferableEmployees[i];
      const fromLocation = createdLocations?.find(l => l.id === emp.locationId);
      const toLocation = getRandomElement(createdLocations?.filter(l => l.id !== emp.locationId) || []);
      
      if (fromLocation && toLocation) {
        const effectiveDate = getRandomDate(new Date('2024-06-01'), new Date('2025-06-01'));
        const status = Math.random() > 0.3 ? 'completed' : 'pending';
        
        await supabase.from('employee_transfers').insert({
          employee_id: emp.id,
          from_store_id: fromLocation.id,
          to_store_id: toLocation.id,
          effective_date: effectiveDate,
          transfer_date: effectiveDate,
          reason: getRandomElement(['Promotion', 'Location preference', 'Business requirement', 'Team restructuring']),
          notes: `Transfer from ${fromLocation.name} to ${toLocation.name}`,
          status
        });
      }
    }
    console.log('Created employee transfers');

    // Step 13: Create salary structures
    console.log('Creating salary structures...');
    for (const emp of createdEmployees) {
      const salary = getSalaryByLevel(emp.designationLevel);
      await supabase.from('salary_structures').insert({
        employee_id: emp.id,
        basic_salary: salary.basic,
        hra: salary.hra,
        transport_allowance: salary.transport,
        medical_allowance: salary.medical,
        other_allowances: salary.other,
        pf_deduction: salary.pf,
        tax_deduction: salary.tax,
        other_deductions: Math.floor(salary.basic * 0.02),
        effective_from: emp.joiningDate
      });
    }
    console.log('Created salary structures');

    // Step 14: Create leave balances
    console.log('Creating leave balances...');
    for (const emp of createdEmployees) {
      for (const lt of createdLeaveTypes || []) {
        const usedDays = Math.floor(Math.random() * Math.min(lt.max_days / 2, 5));
        await supabase.from('leave_balances').insert({
          employee_id: emp.id,
          leave_type_id: lt.id,
          year: 2025,
          total_days: lt.max_days,
          used_days: usedDays,
          pending_days: Math.floor(Math.random() * 3)
        });
      }
    }
    console.log('Created leave balances');

    // Step 15: Create shift assignments
    console.log('Creating shift assignments...');
    for (const emp of createdEmployees) {
      const shift = getRandomElement(createdShifts || []);
      await supabase.from('shift_assignments').insert({
        employee_id: emp.id,
        shift_id: shift.id,
        start_date: emp.joiningDate,
        is_active: true,
        store_id: emp.locationId
      });
    }
    console.log('Created shift assignments');

    // Step 16: Create attendance records (last 60 days)
    console.log('Creating attendance records...');
    const today = new Date();
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    for (const emp of createdEmployees) {
      const empJoinDate = new Date(emp.joiningDate);
      const startDate = empJoinDate > sixtyDaysAgo ? empJoinDate : sixtyDaysAgo;
      
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = d.toISOString().split('T')[0];
        const rand = Math.random();
        let status = 'present';
        let checkIn: string | null = '09:00';
        let checkOut: string | null = '18:00';
        
        if (rand < 0.03) {
          status = 'absent';
          checkIn = null;
          checkOut = null;
        } else if (rand < 0.08) {
          status = 'on-leave';
          checkIn = null;
          checkOut = null;
        } else if (rand < 0.15) {
          status = 'late';
          const lateMinutes = Math.floor(Math.random() * 60) + 10;
          const hours = Math.floor(lateMinutes / 60) + 9;
          const mins = lateMinutes % 60;
          checkIn = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        } else if (rand < 0.20) {
          status = 'half-day';
          checkOut = '13:00';
        }
        
        const workHours = status === 'present' || status === 'late' ? 8 + Math.random() : (status === 'half-day' ? 4 : 0);

        await supabase.from('attendance_records').insert({
          employee_id: emp.id,
          date: dateStr,
          status,
          check_in: checkIn,
          check_out: checkOut,
          work_hours: Number(workHours.toFixed(2)),
          store_id: emp.locationId
        });
      }
    }
    console.log('Created attendance records');

    // Step 17: Create leave requests
    console.log('Creating leave requests...');
    for (let i = 0; i < 100; i++) {
      const emp = getRandomElement(createdEmployees);
      const leaveType = getRandomElement(createdLeaveTypes || []);
      const statusRand = Math.random();
      const status = statusRand < 0.15 ? 'pending' : (statusRand < 0.85 ? 'approved' : 'rejected');
      
      const startDate = getRandomDate(new Date('2025-01-01'), new Date('2025-12-31'));
      const days = Math.floor(Math.random() * 5) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);

      await supabase.from('leave_requests').insert({
        employee_id: emp.id,
        leave_type_id: leaveType.id,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        days,
        reason: getRandomElement([
          'Family function',
          'Personal work',
          'Medical appointment',
          'Travel plans',
          'Festival celebration',
          'Home renovation',
          'Relative visit'
        ]),
        status,
        comments: status !== 'pending' ? (status === 'approved' ? 'Approved as per policy' : 'Insufficient leave balance') : null,
        store_id: emp.locationId
      });
    }
    console.log('Created leave requests');

    // Step 18: Create payslips (last 6 months)
    console.log('Creating payslips...');
    const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    for (const emp of createdEmployees) {
      const salary = getSalaryByLevel(emp.designationLevel);
      const grossEarnings = salary.basic + salary.hra + salary.transport + salary.medical + salary.other;
      const totalDeductions = salary.pf + salary.tax + Math.floor(salary.basic * 0.02);
      const netPay = grossEarnings - totalDeductions;

      for (const month of months) {
        const empJoinDate = new Date(emp.joiningDate);
        const payMonth = new Date(month + '-01');
        if (payMonth < empJoinDate) continue;

        await supabase.from('payslips').insert({
          employee_id: emp.id,
          pay_period: month,
          pay_date: `${month}-28`,
          basic_salary: salary.basic,
          gross_earnings: grossEarnings,
          total_deductions: totalDeductions,
          net_pay: netPay,
          status: 'paid'
        });
      }
    }
    console.log('Created payslips');

    // Step 19: Create announcements
    console.log('Creating announcements...');
    const announcements = [
      { title: 'Office Closed for Diwali', content: 'The office will be closed from October 20-21 for Diwali celebrations. Wishing everyone a happy and prosperous Diwali!', type: 'holiday', priority: 'high' },
      { title: 'Annual Performance Reviews', content: 'Annual performance review cycle begins from January 15th. Please prepare your self-assessments and schedule meetings with your managers.', type: 'policy', priority: 'high' },
      { title: 'New Health Insurance Provider', content: 'We are pleased to announce our partnership with Star Health Insurance. Enhanced coverage begins from February 1st.', type: 'general', priority: 'medium' },
      { title: 'Town Hall Meeting', content: 'Monthly town hall meeting scheduled for December 28th at 3 PM. All employees are requested to attend.', type: 'event', priority: 'medium' },
      { title: 'Work From Home Policy Update', content: 'Updated WFH policy now allows 2 days of remote work per week. Please coordinate with your team leads.', type: 'policy', priority: 'medium' },
      { title: 'Quarterly Results Celebration', content: 'Congratulations team! We exceeded our Q4 targets by 15%. Celebration party on Friday!', type: 'general', priority: 'low' },
      { title: 'IT Maintenance Window', content: 'Scheduled maintenance on December 30th from 11 PM to 5 AM. Some services may be unavailable.', type: 'urgent', priority: 'high' },
      { title: 'New Joinees Welcome', content: 'Please welcome our 5 new team members joining this month. Introduction session on Monday.', type: 'general', priority: 'low' },
      { title: 'Training Program Registration', content: 'Leadership training program registrations open. Limited seats available. Apply by January 10th.', type: 'event', priority: 'medium' },
      { title: 'Year End Party', content: 'Annual year-end celebration on December 31st at Grand Ballroom. Dress code: Festive Formal.', type: 'event', priority: 'high' }
    ];

    for (const ann of announcements) {
      await supabase.from('announcements').insert({
        ...ann,
        target_audience: 'all',
        created_by: createdEmployees[0].userId,
        is_active: true
      });
    }
    console.log('Created announcements');

    // Step 20: Create helpdesk tickets
    console.log('Creating helpdesk tickets...');
    const ticketSubjects = [
      { subject: 'Cannot access email', category: 'it', priority: 'high' },
      { subject: 'Laptop not working', category: 'it', priority: 'urgent' },
      { subject: 'Leave balance incorrect', category: 'hr', priority: 'medium' },
      { subject: 'Payslip query', category: 'payroll', priority: 'medium' },
      { subject: 'VPN connection issue', category: 'it', priority: 'high' },
      { subject: 'Office chair replacement', category: 'admin', priority: 'low' },
      { subject: 'ID card not working', category: 'admin', priority: 'medium' },
      { subject: 'Tax declaration help', category: 'payroll', priority: 'medium' },
      { subject: 'Request for standing desk', category: 'admin', priority: 'low' },
      { subject: 'Software license request', category: 'it', priority: 'medium' }
    ];

    for (let i = 0; i < 25; i++) {
      const emp = getRandomElement(createdEmployees);
      const ticket = getRandomElement(ticketSubjects);
      const status = Math.random() < 0.6 ? 'open' : (Math.random() < 0.8 ? 'in-progress' : 'resolved');

      const { data: createdTicket } = await supabase
        .from('helpdesk_tickets')
        .insert({
          employee_id: emp.id,
          subject: ticket.subject,
          description: `Detailed description for: ${ticket.subject}. Please help resolve this issue at the earliest.`,
          category: ticket.category,
          priority: ticket.priority,
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .select()
        .single();

      // Add messages to ticket
      if (createdTicket) {
        await supabase.from('ticket_messages').insert({
          ticket_id: createdTicket.id,
          sender_id: emp.id,
          message: `Hi, I need help with ${ticket.subject.toLowerCase()}. This is affecting my work.`
        });

        if (status !== 'open') {
          await supabase.from('ticket_messages').insert({
            ticket_id: createdTicket.id,
            sender_id: createdEmployees[0].id, // Admin responds
            message: 'Thank you for reporting this. We are looking into it and will update you soon.'
          });
        }
      }
    }
    console.log('Created helpdesk tickets');

    // Step 21: Create notifications
    console.log('Creating notifications...');
    for (const emp of createdEmployees.slice(0, 20)) {
      const notifications = [
        { title: 'Leave Approved', message: 'Your leave request has been approved.', type: 'success' },
        { title: 'New Announcement', message: 'Check out the latest company announcement.', type: 'info' },
        { title: 'Payslip Generated', message: 'Your December 2024 payslip is ready.', type: 'info' },
        { title: 'Meeting Reminder', message: 'Town hall meeting tomorrow at 3 PM.', type: 'warning' },
        { title: 'Task Assigned', message: 'You have been assigned a new task.', type: 'info' }
      ];

      for (const notif of notifications) {
        await supabase.from('notifications').insert({
          user_id: emp.userId,
          ...notif,
          is_read: Math.random() > 0.5
        });
      }
    }
    console.log('Created notifications');

    // Step 22: Update department employee counts
    console.log('Updating department employee counts...');
    for (const [deptName, deptId] of deptMap) {
      const count = createdEmployees.filter(e => e.departmentId === deptId).length;
      await supabase.from('departments').update({ employee_count: count }).eq('id', deptId);
    }
    console.log('Updated department counts');

    // Step 23: Create asset categories
    console.log('Creating asset categories...');
    const assetCategories = [
      { name: 'Laptops', code: 'LAP', description: 'Laptop computers and notebooks', icon: 'Laptop' },
      { name: 'Mobile Phones', code: 'MOB', description: 'Mobile phones and tablets', icon: 'Smartphone' },
      { name: 'Furniture', code: 'FUR', description: 'Office furniture and fixtures', icon: 'Armchair' },
      { name: 'Vehicles', code: 'VEH', description: 'Company vehicles', icon: 'Car' },
      { name: 'IT Equipment', code: 'IT', description: 'IT equipment and peripherals', icon: 'Monitor' }
    ];

    const { data: createdCategories, error: catError } = await supabase
      .from('asset_categories')
      .insert(assetCategories)
      .select();
    
    if (catError) throw new Error(`Failed to create asset categories: ${catError.message}`);
    console.log(`Created ${createdCategories?.length} asset categories`);

    const categoryMap = new Map(createdCategories?.map(c => [c.code, c.id]) || []);

    // Step 24: Create assets
    console.log('Creating assets...');
    const assetTemplates = [
      // Laptops
      { category: 'LAP', name: 'MacBook Pro 14"', brand: 'Apple', model: 'M3 Pro', cost: 199900 },
      { category: 'LAP', name: 'MacBook Air 13"', brand: 'Apple', model: 'M2', cost: 114900 },
      { category: 'LAP', name: 'ThinkPad X1 Carbon', brand: 'Lenovo', model: 'Gen 11', cost: 145000 },
      { category: 'LAP', name: 'Dell XPS 15', brand: 'Dell', model: '9530', cost: 175000 },
      { category: 'LAP', name: 'HP EliteBook 840', brand: 'HP', model: 'G10', cost: 125000 },
      // Phones
      { category: 'MOB', name: 'iPhone 15 Pro', brand: 'Apple', model: 'A2848', cost: 134900 },
      { category: 'MOB', name: 'iPhone 14', brand: 'Apple', model: 'A2649', cost: 79900 },
      { category: 'MOB', name: 'Samsung Galaxy S24', brand: 'Samsung', model: 'SM-S921B', cost: 79999 },
      { category: 'MOB', name: 'OnePlus 12', brand: 'OnePlus', model: 'CPH2573', cost: 64999 },
      // Furniture
      { category: 'FUR', name: 'Ergonomic Office Chair', brand: 'Herman Miller', model: 'Aeron', cost: 145000 },
      { category: 'FUR', name: 'Standing Desk', brand: 'Flexispot', model: 'E7 Pro', cost: 45000 },
      { category: 'FUR', name: 'Executive Desk', brand: 'Godrej', model: 'Interio', cost: 35000 },
      { category: 'FUR', name: 'Conference Table', brand: 'Nilkamal', model: 'Matrix', cost: 75000 },
      // Vehicles
      { category: 'VEH', name: 'Toyota Innova Crysta', brand: 'Toyota', model: '2024', cost: 2500000 },
      { category: 'VEH', name: 'Maruti Swift Dzire', brand: 'Maruti Suzuki', model: '2024', cost: 850000 },
      { category: 'VEH', name: 'Honda City', brand: 'Honda', model: '2024', cost: 1350000 },
      // IT Equipment
      { category: 'IT', name: 'Dell Monitor 27"', brand: 'Dell', model: 'U2722D', cost: 45000 },
      { category: 'IT', name: 'HP LaserJet Printer', brand: 'HP', model: 'M428fdw', cost: 52000 },
      { category: 'IT', name: 'Logitech Webcam', brand: 'Logitech', model: 'C920', cost: 8500 },
      { category: 'IT', name: 'Apple Magic Keyboard', brand: 'Apple', model: 'A1843', cost: 12900 }
    ];

    const statuses = ['available', 'assigned', 'maintenance', 'available', 'assigned', 'assigned'];
    const conditions = ['new', 'good', 'good', 'fair', 'good', 'new'];
    const allStoreIds = createdLocations?.map(s => s.id) || [];

    const assetsToCreate = [];
    let assetCounter = 1;

    for (let i = 0; i < 100; i++) {
      const template = getRandomElement(assetTemplates);
      const status = getRandomElement(statuses);
      const locationId = getRandomElement(allStoreIds);
      const purchaseDate = getRandomDate(new Date('2022-01-01'), new Date('2024-12-01'));
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 2);

      assetsToCreate.push({
        asset_tag: `AST-2024-${String(assetCounter).padStart(4, '0')}`,
        name: template.name,
        category_id: categoryMap.get(template.category),
        brand: template.brand,
        model: template.model,
        serial_number: `SN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`,
        purchase_date: purchaseDate,
        purchase_cost: template.cost + Math.floor(Math.random() * 10000) - 5000,
        warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
        status,
        condition: getRandomElement(conditions),
        location_id: locationId,
        notes: status === 'maintenance' ? 'Under scheduled maintenance' : null
      });
      assetCounter++;
    }

    const { data: createdAssets, error: assetError } = await supabase
      .from('assets')
      .insert(assetsToCreate)
      .select();
    
    if (assetError) throw new Error(`Failed to create assets: ${assetError.message}`);
    console.log(`Created ${createdAssets?.length} assets`);

    // Step 25: Create asset assignments for assigned assets
    console.log('Creating asset assignments...');
    const assignedAssets = createdAssets?.filter(a => a.status === 'assigned') || [];
    const employeeIds = createdEmployees.map(e => e.id);

    const assignmentsToCreate = assignedAssets.slice(0, 40).map((asset, index) => ({
      asset_id: asset.id,
      employee_id: employeeIds[index % employeeIds.length],
      location_id: asset.location_id,
      assigned_date: getRandomDate(new Date('2024-01-01'), new Date('2024-12-01')),
      condition_on_assign: asset.condition,
      notes: 'Assigned for official use'
    }));

    // Update assets with assigned_to
    for (const assignment of assignmentsToCreate) {
      await supabase.from('assets').update({ 
        assigned_to: assignment.employee_id,
        assigned_date: assignment.assigned_date 
      }).eq('id', assignment.asset_id);
    }

    const { error: assignError } = await supabase
      .from('asset_assignments')
      .insert(assignmentsToCreate);
    
    if (assignError) console.log(`Note: Asset assignments error: ${assignError.message}`);
    console.log(`Created ${assignmentsToCreate.length} asset assignments`);

    // Step 26: Create asset transfers
    console.log('Creating asset transfers...');
    const availableAssets = createdAssets?.filter(a => a.status === 'available') || [];
    const transfersToCreate = availableAssets.slice(0, 15).map((asset, index) => {
      const fromLocation = allStoreIds[index % allStoreIds.length];
      let toLocation = allStoreIds[(index + 1) % allStoreIds.length];
      if (fromLocation === toLocation && allStoreIds.length > 1) {
        toLocation = allStoreIds[(index + 2) % allStoreIds.length];
      }
      return {
        asset_id: asset.id,
        from_location_id: fromLocation,
        to_location_id: toLocation,
        transfer_date: getRandomDate(new Date('2024-06-01'), new Date('2024-12-01')),
        reason: getRandomElement(['Reallocation', 'Store requirement', 'Inventory balancing', 'New store opening']),
        status: 'completed',
        notes: 'Transfer completed successfully'
      };
    });

    const { error: transferError } = await supabase
      .from('asset_transfers')
      .insert(transfersToCreate);
    
    if (transferError) console.log(`Note: Asset transfers error: ${transferError.message}`);
    console.log(`Created ${transfersToCreate.length} asset transfers`);

    // Step 27: Create asset maintenance records
    console.log('Creating asset maintenance records...');
    const maintenanceAssets = createdAssets?.filter(a => a.status === 'maintenance') || [];
    const allAssets = createdAssets || [];
    
    const maintenanceToCreate = [
      ...maintenanceAssets.map(asset => ({
        asset_id: asset.id,
        type: 'repair',
        description: 'Scheduled repair and maintenance',
        scheduled_date: getRandomDate(new Date('2024-10-01'), new Date('2025-01-15')),
        status: 'in_progress',
        cost: Math.floor(Math.random() * 5000) + 1000,
        vendor: getRandomElement(['Apple Service Center', 'Lenovo Support', 'Local IT Partner', 'Dell Service']),
        notes: 'Under maintenance'
      })),
      ...allAssets.slice(0, 20).map(asset => ({
        asset_id: asset.id,
        type: getRandomElement(['service', 'upgrade', 'inspection']),
        description: getRandomElement(['Annual service', 'RAM upgrade', 'Routine inspection', 'Software update']),
        scheduled_date: getRandomDate(new Date('2024-01-01'), new Date('2024-09-01')),
        completed_date: getRandomDate(new Date('2024-01-15'), new Date('2024-09-15')),
        status: 'completed',
        cost: Math.floor(Math.random() * 3000) + 500,
        vendor: getRandomElement(['Apple Service Center', 'HP Care', 'Dell Support', 'IT Solutions Inc']),
        notes: 'Completed successfully'
      }))
    ];

    const { error: maintError } = await supabase
      .from('asset_maintenance')
      .insert(maintenanceToCreate);
    
    if (maintError) console.log(`Note: Asset maintenance error: ${maintError.message}`);
    console.log(`Created ${maintenanceToCreate.length} maintenance records`);

    console.log('Database seeding completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        stats: {
          employees: createdEmployees.length,
          departments: createdDepts?.length || 0,
          designations: createdDesignations?.length || 0,
          stores: storeLocations.length,
          offices: officeLocations.length,
          leaveTypes: createdLeaveTypes?.length || 0,
          shifts: createdShifts?.length || 0,
          holidays: holidays2025.length,
          transfers: 10,
          assetCategories: createdCategories?.length || 0,
          assets: createdAssets?.length || 0,
          assetAssignments: assignmentsToCreate.length,
          assetTransfers: transfersToCreate.length,
          assetMaintenance: maintenanceToCreate.length
        },
        testCredentials: {
          admin: 'admin@company.com / Test@123',
          hr: 'hr1@company.com / Test@123',
          storeManager: 'storemanager1@company.com / Test@123',
          manager: 'manager.engineering@company.com / Test@123',
          employee: 'emp001@company.com / Test@123'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Seeding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
