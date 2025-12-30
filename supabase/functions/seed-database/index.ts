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

// Letter templates data
const letterTemplates = [
  {
    name: 'Standard Offer Letter',
    type: 'offer',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">OFFER LETTER</h1>
      <p style="text-align: right;">Date: {{date}}</p>
      <p>Dear <strong>{{employee_name}}</strong>,</p>
      <p>We are pleased to offer you the position of <strong>{{designation}}</strong> in our <strong>{{department}}</strong> department at {{company_name}}.</p>
      <h3>Terms of Employment:</h3>
      <ul>
        <li><strong>Position:</strong> {{designation}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Start Date:</strong> {{joining_date}}</li>
        <li><strong>CTC:</strong> ₹{{ctc}} per annum</li>
        <li><strong>Location:</strong> {{location}}</li>
      </ul>
      <p>This offer is contingent upon successful completion of background verification and submission of required documents.</p>
      <p>Please sign and return this letter to confirm your acceptance by {{acceptance_deadline}}.</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>{{hr_name}}</strong><br/>Human Resources<br/>{{company_name}}</p>
    </div>`,
    placeholders: ['employee_name', 'designation', 'department', 'company_name', 'joining_date', 'ctc', 'location', 'acceptance_deadline', 'hr_name', 'date'],
    is_default: true
  },
  {
    name: 'Experience Letter',
    type: 'experience',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">EXPERIENCE CERTIFICATE</h1>
      <p style="text-align: right;">Date: {{date}}<br/>Ref: EXP/{{reference_number}}</p>
      <h3>TO WHOM IT MAY CONCERN</h3>
      <p>This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}}) was employed with <strong>{{company_name}}</strong> from <strong>{{joining_date}}</strong> to <strong>{{last_working_date}}</strong>.</p>
      <p>During their tenure, they held the position of <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>
      <h3>Key Responsibilities:</h3>
      <p>{{responsibilities}}</p>
      <p>We found {{employee_name}} to be sincere, hardworking, and dedicated. Their conduct and character have been good during their association with us.</p>
      <p>We wish them all the best for their future endeavors.</p>
      <br/>
      <p>For {{company_name}}</p>
      <br/><br/>
      <p><strong>{{hr_name}}</strong><br/>{{hr_designation}}<br/>Human Resources</p>
    </div>`,
    placeholders: ['employee_name', 'employee_id', 'company_name', 'joining_date', 'last_working_date', 'designation', 'department', 'responsibilities', 'hr_name', 'hr_designation', 'date', 'reference_number'],
    is_default: true
  },
  {
    name: 'Relieving Letter',
    type: 'relieving',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">RELIEVING LETTER</h1>
      <p style="text-align: right;">Date: {{date}}<br/>Ref: REL/{{reference_number}}</p>
      <p>Dear <strong>{{employee_name}}</strong>,</p>
      <p>With reference to your resignation letter dated {{resignation_date}}, this is to inform you that your resignation has been accepted and you are relieved from your duties effective <strong>{{last_working_date}}</strong>.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Employee ID:</strong> {{employee_id}}</li>
        <li><strong>Designation:</strong> {{designation}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Date of Joining:</strong> {{joining_date}}</li>
        <li><strong>Last Working Date:</strong> {{last_working_date}}</li>
      </ul>
      <p>All company assets and dues have been settled, and you have completed all the exit formalities as required.</p>
      <p>We thank you for your contributions and wish you success in your future endeavors.</p>
      <br/>
      <p>For {{company_name}}</p>
      <br/><br/>
      <p><strong>{{hr_name}}</strong><br/>Human Resources</p>
    </div>`,
    placeholders: ['employee_name', 'employee_id', 'resignation_date', 'last_working_date', 'designation', 'department', 'joining_date', 'company_name', 'hr_name', 'date', 'reference_number'],
    is_default: true
  },
  {
    name: 'Increment Letter',
    type: 'increment',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">SALARY REVISION LETTER</h1>
      <p style="text-align: right;">Date: {{date}}</p>
      <p>Dear <strong>{{employee_name}}</strong>,</p>
      <p>We are pleased to inform you that based on your performance evaluation and contribution to the organization, the management has decided to revise your compensation effective <strong>{{effective_date}}</strong>.</p>
      <h3>Revised Compensation Details:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Previous CTC:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹{{previous_ctc}} per annum</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Revised CTC:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹{{new_ctc}} per annum</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Increment:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{increment_percentage}}%</td></tr>
      </table>
      <p>We appreciate your dedication and hard work. We look forward to your continued contribution to the organization's success.</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>{{hr_name}}</strong><br/>Human Resources<br/>{{company_name}}</p>
    </div>`,
    placeholders: ['employee_name', 'effective_date', 'previous_ctc', 'new_ctc', 'increment_percentage', 'hr_name', 'company_name', 'date'],
    is_default: true
  },
  {
    name: 'Promotion Letter',
    type: 'promotion',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">PROMOTION LETTER</h1>
      <p style="text-align: right;">Date: {{date}}</p>
      <p>Dear <strong>{{employee_name}}</strong>,</p>
      <p>Congratulations! We are delighted to inform you that based on your exceptional performance and dedication, you have been promoted to the position of <strong>{{new_designation}}</strong> effective <strong>{{effective_date}}</strong>.</p>
      <h3>Promotion Details:</h3>
      <ul>
        <li><strong>Previous Designation:</strong> {{previous_designation}}</li>
        <li><strong>New Designation:</strong> {{new_designation}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Revised CTC:</strong> ₹{{new_ctc}} per annum</li>
      </ul>
      <p>With this new role comes additional responsibilities. We are confident that you will continue to excel and contribute significantly to our organization's growth.</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>{{hr_name}}</strong><br/>Human Resources<br/>{{company_name}}</p>
    </div>`,
    placeholders: ['employee_name', 'previous_designation', 'new_designation', 'department', 'new_ctc', 'effective_date', 'hr_name', 'company_name', 'date'],
    is_default: false
  },
  {
    name: 'Appointment Letter',
    type: 'appointment',
    content: `<div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1 style="text-align: center; color: #1a365d;">APPOINTMENT LETTER</h1>
      <p style="text-align: right;">Date: {{date}}</p>
      <p>Dear <strong>{{employee_name}}</strong>,</p>
      <p>Following the offer letter dated {{offer_date}}, we are pleased to confirm your appointment as <strong>{{designation}}</strong> in our <strong>{{department}}</strong> department, effective <strong>{{joining_date}}</strong>.</p>
      <h3>Employment Terms:</h3>
      <ul>
        <li><strong>Employee ID:</strong> {{employee_id}}</li>
        <li><strong>Designation:</strong> {{designation}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Reporting To:</strong> {{reporting_manager}}</li>
        <li><strong>Annual CTC:</strong> ₹{{ctc}}</li>
        <li><strong>Work Location:</strong> {{location}}</li>
        <li><strong>Probation Period:</strong> {{probation_period}} months</li>
      </ul>
      <p>Please find attached the detailed terms and conditions of your employment. By signing this letter, you acknowledge that you have read and accepted all terms.</p>
      <br/>
      <p>Welcome to the team!</p>
      <p><strong>{{hr_name}}</strong><br/>Human Resources<br/>{{company_name}}</p>
    </div>`,
    placeholders: ['employee_name', 'offer_date', 'designation', 'department', 'joining_date', 'employee_id', 'reporting_manager', 'ctc', 'location', 'probation_period', 'hr_name', 'company_name', 'date'],
    is_default: false
  }
];

// Announcement templates
const announcementTemplates = [
  { name: 'General Announcement', type: 'general', priority: 'medium', target_audience: 'all', title: 'Important Update', content: 'Dear Team, we would like to share an important update with you...' },
  { name: 'Policy Update', type: 'policy', priority: 'high', target_audience: 'all', title: 'Policy Change Notice', content: 'Please be informed about the following policy updates effective from...' },
  { name: 'Event Announcement', type: 'event', priority: 'medium', target_audience: 'all', title: 'Upcoming Event', content: 'We are excited to announce an upcoming event that will be held on...' },
  { name: 'Holiday Notice', type: 'holiday', priority: 'low', target_audience: 'all', title: 'Holiday Notice', content: 'Please note that the office will remain closed on the following dates...' },
  { name: 'Urgent Notice', type: 'urgent', priority: 'high', target_audience: 'all', title: 'Urgent: Immediate Attention Required', content: 'This is an urgent notice that requires your immediate attention...' },
  { name: 'Welcome New Joinees', type: 'general', priority: 'low', target_audience: 'all', title: 'Welcome New Team Members', content: 'Please join us in welcoming our new team members who have joined...' }
];

// Banner templates
const bannerTemplates = [
  { name: 'High Priority Banner', priority_type: 'high', html_content: '<div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px; text-align: center; font-weight: bold; border-radius: 8px;"><span style="margin-right: 8px;">🚨</span>{{message}}</div>' },
  { name: 'Medium Priority Banner', priority_type: 'medium', html_content: '<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px; text-align: center; font-weight: 600; border-radius: 8px;"><span style="margin-right: 8px;">⚠️</span>{{message}}</div>' },
  { name: 'Low Priority Banner', priority_type: 'low', html_content: '<div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px; text-align: center; border-radius: 8px;"><span style="margin-right: 8px;">ℹ️</span>{{message}}</div>' },
  { name: 'Event Banner', priority_type: 'event', html_content: '<div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px; text-align: center; border-radius: 8px;"><span style="margin-right: 8px;">🎉</span>{{message}}</div>' }
];

// Document types for employees
const documentTypes = [
  { type: 'pdf', category: 'ID Proof', name: 'Aadhar Card' },
  { type: 'pdf', category: 'ID Proof', name: 'PAN Card' },
  { type: 'pdf', category: 'ID Proof', name: 'Passport' },
  { type: 'pdf', category: 'Educational', name: 'Degree Certificate' },
  { type: 'pdf', category: 'Educational', name: '10th Marksheet' },
  { type: 'pdf', category: 'Educational', name: '12th Marksheet' },
  { type: 'pdf', category: 'Employment', name: 'Previous Experience Letter' },
  { type: 'pdf', category: 'Employment', name: 'Previous Relieving Letter' },
  { type: 'pdf', category: 'Employment', name: 'Offer Letter' },
  { type: 'pdf', category: 'Policy', name: 'Employee Handbook' },
  { type: 'pdf', category: 'Policy', name: 'Code of Conduct' },
  { type: 'pdf', category: 'Other', name: 'Address Proof' }
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
      'asset_maintenance_requests',
      'asset_maintenance',
      'asset_transfers',
      'asset_assignments',
      'assets',
      'asset_categories',
      'ticket_messages',
      'helpdesk_tickets',
      'attendance_regularization_requests',
      'profile_change_requests',
      'shift_exchange_requests',
      'payslips',
      'salary_structures',
      'leave_requests',
      'leave_balances',
      'shift_assignments',
      'attendance_records',
      'generated_letters',
      'letter_templates',
      'notifications',
      'targeted_notifications',
      'announcements',
      'announcement_templates',
      'announcement_banner_templates',
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
      name: string;
      email: string;
      userId: string;
      departmentId: string;
      designationId: string;
      designationName: string;
      departmentName: string;
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

        // Generate avatar URL using DiceBear API with unique seed
        const avatarSeed = `${firstName}${lastName}${createdEmployees.length}`;
        const avatarStyle = getRandomElement(['avataaars', 'lorelei', 'notionists', 'personas']);
        const avatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

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
            avatar_url: avatarUrl,
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
          name: `${firstName} ${lastName}`,
          email,
          userId: user.id,
          departmentId: deptId,
          designationId: designation?.id,
          designationName: designation?.name || 'Employee',
          departmentName: dept.department,
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

    // Step 13: Create salary structures (batch insert)
    console.log('Creating salary structures...');
    const salaryStructuresToCreate = createdEmployees.map(emp => {
      const salary = getSalaryByLevel(emp.designationLevel);
      return {
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
      };
    });
    const { error: ssError } = await supabase.from('salary_structures').insert(salaryStructuresToCreate);
    if (ssError) console.log(`Salary structures error: ${ssError.message}`);
    console.log('Created salary structures');

    // Step 14: Create leave balances (batch insert)
    console.log('Creating leave balances...');
    const leaveBalancesToCreate = [];
    for (const emp of createdEmployees) {
      for (const lt of createdLeaveTypes || []) {
        const usedDays = Math.floor(Math.random() * Math.min(lt.max_days / 2, 5));
        leaveBalancesToCreate.push({
          employee_id: emp.id,
          leave_type_id: lt.id,
          year: 2025,
          total_days: lt.max_days,
          used_days: usedDays,
          pending_days: Math.floor(Math.random() * 3)
        });
      }
    }
    const { error: lbError } = await supabase.from('leave_balances').insert(leaveBalancesToCreate);
    if (lbError) console.log(`Leave balances error: ${lbError.message}`);
    console.log('Created leave balances');

    // Step 15: Create shift assignments (batch insert)
    console.log('Creating shift assignments...');
    const shiftAssignmentsToCreate = createdEmployees.map(emp => ({
      employee_id: emp.id,
      shift_id: getRandomElement(createdShifts || []).id,
      start_date: emp.joiningDate,
      is_active: true,
      store_id: emp.locationId
    }));
    const { error: saError } = await supabase.from('shift_assignments').insert(shiftAssignmentsToCreate);
    if (saError) console.log(`Shift assignments error: ${saError.message}`);
    console.log('Created shift assignments');

    // Step 16: Create attendance records (batch insert - last 60 days)
    console.log('Creating attendance records...');
    const today = new Date();
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const attendanceRecordsToCreate = [];
    for (const emp of createdEmployees) {
      const empJoinDate = new Date(emp.joiningDate);
      const startDate = empJoinDate > sixtyDaysAgo ? empJoinDate : sixtyDaysAgo;
      
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
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

        attendanceRecordsToCreate.push({
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
    // Insert in batches of 500 to avoid payload limits
    for (let i = 0; i < attendanceRecordsToCreate.length; i += 500) {
      const batch = attendanceRecordsToCreate.slice(i, i + 500);
      const { error: attError } = await supabase.from('attendance_records').insert(batch);
      if (attError) console.log(`Attendance batch error: ${attError.message}`);
    }
    console.log(`Created ${attendanceRecordsToCreate.length} attendance records`);

    // Step 17: Create leave requests (batch insert)
    console.log('Creating leave requests...');
    const leaveRequestsToCreate = [];
    for (let i = 0; i < 100; i++) {
      const emp = getRandomElement(createdEmployees);
      const leaveType = getRandomElement(createdLeaveTypes || []);
      const statusRand = Math.random();
      const status = statusRand < 0.15 ? 'pending' : (statusRand < 0.85 ? 'approved' : 'rejected');
      
      const startDate = getRandomDate(new Date('2025-01-01'), new Date('2025-12-31'));
      const days = Math.floor(Math.random() * 5) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);

      leaveRequestsToCreate.push({
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
    const { error: lrError } = await supabase.from('leave_requests').insert(leaveRequestsToCreate);
    if (lrError) console.log(`Leave requests error: ${lrError.message}`);
    console.log('Created leave requests');

    // Step 18: Create payslips (batch insert - last 6 months)
    console.log('Creating payslips...');
    const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    const payslipsToCreate = [];
    for (const emp of createdEmployees) {
      const salary = getSalaryByLevel(emp.designationLevel);
      const grossEarnings = salary.basic + salary.hra + salary.transport + salary.medical + salary.other;
      const totalDeductions = salary.pf + salary.tax + Math.floor(salary.basic * 0.02);
      const netPay = grossEarnings - totalDeductions;

      for (const month of months) {
        const empJoinDate = new Date(emp.joiningDate);
        const payMonth = new Date(month + '-01');
        if (payMonth < empJoinDate) continue;

        payslipsToCreate.push({
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
    const { error: psError } = await supabase.from('payslips').insert(payslipsToCreate);
    if (psError) console.log(`Payslips error: ${psError.message}`);
    console.log('Created payslips');

    // Step 19: Create letter templates
    console.log('Creating letter templates...');
    const { data: createdLetterTemplates, error: ltplError } = await supabase
      .from('letter_templates')
      .insert(letterTemplates.map(t => ({
        name: t.name,
        type: t.type,
        content: t.content,
        placeholders: t.placeholders,
        is_default: t.is_default,
        is_active: true,
        created_by: createdEmployees[0].userId
      })))
      .select();
    if (ltplError) console.log(`Letter templates error: ${ltplError.message}`);
    console.log(`Created ${createdLetterTemplates?.length || 0} letter templates`);

    // Step 20: Create generated letters for employees
    console.log('Creating generated letters...');
    const generatedLettersToCreate = [];
    const letterTypes = ['offer', 'experience', 'increment', 'relieving'];
    
    for (let i = 0; i < 30; i++) {
      const emp = createdEmployees[i % createdEmployees.length];
      const letterType = letterTypes[i % letterTypes.length];
      const template = createdLetterTemplates?.find(t => t.type === letterType);
      
      let content = template?.content || '<p>Letter content</p>';
      content = content.replace(/\{\{employee_name\}\}/g, emp.name);
      content = content.replace(/\{\{designation\}\}/g, emp.designationName);
      content = content.replace(/\{\{department\}\}/g, emp.departmentName);
      content = content.replace(/\{\{company_name\}\}/g, 'TechCorp Solutions');
      content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
      content = content.replace(/\{\{joining_date\}\}/g, emp.joiningDate);

      generatedLettersToCreate.push({
        employee_id: emp.id,
        type: letterType,
        template_id: template?.id,
        content,
        status: 'generated',
        generated_by: createdEmployees[0].userId,
        generated_at: getRandomDate(new Date('2024-01-01'), new Date())
      });
    }
    const { error: glError } = await supabase.from('generated_letters').insert(generatedLettersToCreate);
    if (glError) console.log(`Generated letters error: ${glError.message}`);
    console.log(`Created ${generatedLettersToCreate.length} generated letters`);

    // Step 21: Create announcement templates
    console.log('Creating announcement templates...');
    const { error: atError } = await supabase
      .from('announcement_templates')
      .insert(announcementTemplates.map(t => ({
        ...t,
        is_active: true,
        is_default: t.name.includes('General'),
        created_by: createdEmployees[0].userId
      })));
    if (atError) console.log(`Announcement templates error: ${atError.message}`);
    console.log('Created announcement templates');

    // Step 22: Create banner templates
    console.log('Creating banner templates...');
    const { error: btError } = await supabase
      .from('announcement_banner_templates')
      .insert(bannerTemplates.map(t => ({
        ...t,
        is_active: true,
        is_default: t.priority_type === 'medium',
        created_by: createdEmployees[0].userId
      })));
    if (btError) console.log(`Banner templates error: ${btError.message}`);
    console.log('Created banner templates');

    // Step 23: Create announcements (batch insert)
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
      { title: 'Year End Party', content: 'Annual year-end celebration on December 31st at Grand Ballroom. Dress code: Festive Formal.', type: 'event', priority: 'high' },
      { title: 'New Cafeteria Menu', content: 'Our cafeteria has introduced a new healthy menu starting next week. Check out the variety of options!', type: 'general', priority: 'low' },
      { title: 'Security Awareness Training', content: 'Mandatory security awareness training for all employees. Please complete by January 31st.', type: 'policy', priority: 'high' }
    ].map(ann => ({
      ...ann,
      target_audience: 'all',
      created_by: createdEmployees[0].userId,
      is_active: true
    }));
    const { error: annError } = await supabase.from('announcements').insert(announcements);
    if (annError) console.log(`Announcements error: ${annError.message}`);
    console.log('Created announcements');

    // Step 24: Create employee documents
    console.log('Creating employee documents...');
    const documentsToCreate = [];
    for (const emp of createdEmployees) {
      // Add 2-4 documents per employee
      const numDocs = Math.floor(Math.random() * 3) + 2;
      const selectedDocs = [...documentTypes].sort(() => 0.5 - Math.random()).slice(0, numDocs);
      
      for (const doc of selectedDocs) {
        documentsToCreate.push({
          employee_id: emp.id,
          name: `${doc.name} - ${emp.name}`,
          type: doc.type,
          document_category: doc.category,
          folder_path: `employees/${emp.id}/${doc.category.toLowerCase().replace(' ', '-')}`,
          file_url: `https://example.com/documents/${emp.id}/${doc.name.toLowerCase().replace(' ', '-')}.pdf`,
          file_size: Math.floor(Math.random() * 500000) + 50000,
          is_company_document: false,
          uploaded_by: emp.userId
        });
      }
    }
    
    // Add company-wide documents
    const companyDocs = [
      { name: 'Employee Handbook 2025', category: 'Policy' },
      { name: 'Code of Conduct', category: 'Policy' },
      { name: 'Leave Policy', category: 'Policy' },
      { name: 'IT Security Guidelines', category: 'Policy' },
      { name: 'Expense Reimbursement Policy', category: 'Policy' }
    ];
    
    for (const doc of companyDocs) {
      documentsToCreate.push({
        employee_id: null,
        name: doc.name,
        type: 'pdf',
        document_category: doc.category,
        folder_path: `company/policies`,
        file_url: `https://example.com/company/${doc.name.toLowerCase().replace(/ /g, '-')}.pdf`,
        file_size: Math.floor(Math.random() * 1000000) + 100000,
        is_company_document: true,
        uploaded_by: createdEmployees[0].userId
      });
    }

    // Insert in batches
    for (let i = 0; i < documentsToCreate.length; i += 100) {
      const batch = documentsToCreate.slice(i, i + 100);
      const { error: docError } = await supabase.from('documents').insert(batch);
      if (docError) console.log(`Documents batch error: ${docError.message}`);
    }
    console.log(`Created ${documentsToCreate.length} documents`);

    // Step 25: Create attendance regularization requests
    console.log('Creating attendance regularization requests...');
    const regularizationRequestsToCreate = [];
    for (let i = 0; i < 20; i++) {
      const emp = getRandomElement(createdEmployees);
      const statusRand = Math.random();
      const status = statusRand < 0.3 ? 'pending' : (statusRand < 0.8 ? 'approved' : 'rejected');
      const requestTypes = ['forgot_clock_in', 'forgot_clock_out', 'wrong_timing', 'system_error', 'biometric_issue'];
      
      const requestDate = getRandomDate(new Date('2024-11-01'), new Date());
      const hrEmployee = createdEmployees.find(e => e.role === 'hr') || createdEmployees[0];
      
      regularizationRequestsToCreate.push({
        employee_id: emp.id,
        request_date: requestDate,
        request_type: getRandomElement(requestTypes),
        original_check_in: status !== 'pending' && Math.random() > 0.5 ? '09:30' : null,
        original_check_out: status !== 'pending' && Math.random() > 0.5 ? '17:30' : null,
        requested_check_in: '09:00',
        requested_check_out: '18:00',
        reason: getRandomElement([
          'Forgot to clock in due to urgent meeting',
          'System was not working properly',
          'Biometric device error',
          'Was working from client location',
          'Had to attend to emergency, forgot to clock out'
        ]),
        status,
        reviewed_by: status !== 'pending' ? hrEmployee.id : null,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
        review_comments: status === 'approved' ? 'Verified and approved' : (status === 'rejected' ? 'Unable to verify the claim' : null)
      });
    }
    const { error: arrError } = await supabase.from('attendance_regularization_requests').insert(regularizationRequestsToCreate);
    if (arrError) console.log(`Attendance regularization error: ${arrError.message}`);
    console.log(`Created ${regularizationRequestsToCreate.length} attendance regularization requests`);

    // Step 26: Create profile change requests
    console.log('Creating profile change requests...');
    const profileChangeRequestsToCreate = [];
    const fieldNames = ['phone', 'address_street', 'address_city', 'emergency_contact_name', 'emergency_contact_phone', 'bank_account_number'];
    
    for (let i = 0; i < 20; i++) {
      const emp = getRandomElement(createdEmployees);
      const fieldName = getRandomElement(fieldNames);
      const statusRand = Math.random();
      const status = statusRand < 0.3 ? 'pending' : (statusRand < 0.85 ? 'approved' : 'rejected');
      const hrEmployee = createdEmployees.find(e => e.role === 'hr') || createdEmployees[0];
      
      let currentValue = '', newValue = '';
      switch(fieldName) {
        case 'phone':
          currentValue = `+91 98${Math.floor(Math.random() * 100000000)}`;
          newValue = `+91 99${Math.floor(Math.random() * 100000000)}`;
          break;
        case 'address_street':
          currentValue = `${Math.floor(Math.random() * 100)}, Old Street`;
          newValue = `${Math.floor(Math.random() * 100)}, New Street`;
          break;
        case 'address_city':
          currentValue = getRandomElement(cities);
          newValue = getRandomElement(cities.filter(c => c !== currentValue));
          break;
        case 'emergency_contact_name':
          currentValue = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
          newValue = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
          break;
        case 'emergency_contact_phone':
          currentValue = `+91 97${Math.floor(Math.random() * 100000000)}`;
          newValue = `+91 98${Math.floor(Math.random() * 100000000)}`;
          break;
        case 'bank_account_number':
          currentValue = `XXXX${Math.floor(Math.random() * 10000)}`;
          newValue = `XXXX${Math.floor(Math.random() * 10000)}`;
          break;
      }
      
      profileChangeRequestsToCreate.push({
        employee_id: emp.id,
        field_name: fieldName,
        current_value: currentValue,
        new_value: newValue,
        reason: getRandomElement([
          'Updated contact number',
          'Changed residence',
          'Updated emergency contact details',
          'Bank account change',
          'Correction in records'
        ]),
        status,
        reviewed_by: status !== 'pending' ? hrEmployee.id : null,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
        review_comments: status === 'approved' ? 'Verified and updated' : (status === 'rejected' ? 'Supporting documents required' : null)
      });
    }
    const { error: pcrError } = await supabase.from('profile_change_requests').insert(profileChangeRequestsToCreate);
    if (pcrError) console.log(`Profile change requests error: ${pcrError.message}`);
    console.log(`Created ${profileChangeRequestsToCreate.length} profile change requests`);

    // Step 27: Create shift exchange requests
    console.log('Creating shift exchange requests...');
    const shiftExchangeRequestsToCreate = [];
    
    for (let i = 0; i < 20; i++) {
      const requesterIdx = Math.floor(Math.random() * createdEmployees.length);
      let targetIdx = Math.floor(Math.random() * createdEmployees.length);
      while (targetIdx === requesterIdx) {
        targetIdx = Math.floor(Math.random() * createdEmployees.length);
      }
      
      const requester = createdEmployees[requesterIdx];
      const target = createdEmployees[targetIdx];
      const statusRand = Math.random();
      const status = statusRand < 0.25 ? 'pending' : (statusRand < 0.5 ? 'approved' : (statusRand < 0.75 ? 'rejected' : 'cancelled'));
      
      shiftExchangeRequestsToCreate.push({
        requester_id: requester.id,
        target_employee_id: target.id,
        requester_shift_id: getRandomElement(createdShifts || []).id,
        target_shift_id: getRandomElement(createdShifts || []).id,
        request_date: getRandomDate(new Date('2025-01-01'), new Date('2025-03-31')),
        reason: getRandomElement([
          'Personal appointment on that day',
          'Family function to attend',
          'Medical appointment scheduled',
          'Important personal work',
          'Travel plans'
        ]),
        status,
        responded_at: status !== 'pending' ? new Date().toISOString() : null,
        response_note: status === 'approved' ? 'Happy to help!' : (status === 'rejected' ? 'Sorry, I have plans that day' : null)
      });
    }
    const { error: serError } = await supabase.from('shift_exchange_requests').insert(shiftExchangeRequestsToCreate);
    if (serError) console.log(`Shift exchange requests error: ${serError.message}`);
    console.log(`Created ${shiftExchangeRequestsToCreate.length} shift exchange requests`);

    // Step 28: Create helpdesk tickets (batch insert) - One ticket per employee + additional random tickets
    console.log('Creating helpdesk tickets...');
    const ticketSubjects = [
      { subject: 'Cannot access email', category: 'it', priority: 'high', description: 'Unable to login to my email account. Getting authentication error since morning.' },
      { subject: 'Laptop not working', category: 'it', priority: 'urgent', description: 'My laptop is not turning on. I have an important presentation today.' },
      { subject: 'Leave balance incorrect', category: 'hr', priority: 'medium', description: 'My casual leave balance shows 5 days but I should have 8 days remaining.' },
      { subject: 'Payslip query', category: 'payroll', priority: 'medium', description: 'There seems to be a discrepancy in my HRA calculation for this month.' },
      { subject: 'VPN connection issue', category: 'it', priority: 'high', description: 'Cannot connect to company VPN while working from home. Tried multiple times.' },
      { subject: 'Office chair replacement', category: 'admin', priority: 'low', description: 'My office chair is broken. Need a replacement for ergonomic reasons.' },
      { subject: 'ID card not working', category: 'admin', priority: 'medium', description: 'My ID card is not being recognized at the main entrance door.' },
      { subject: 'Tax declaration help', category: 'payroll', priority: 'medium', description: 'Need assistance in submitting my tax declaration documents for FY 2024-25.' },
      { subject: 'Request for standing desk', category: 'admin', priority: 'low', description: 'Would like to request a standing desk for better posture.' },
      { subject: 'Software license request', category: 'it', priority: 'medium', description: 'Need a license for Adobe Creative Suite for my design work.' },
      { subject: 'Mouse not working', category: 'it', priority: 'medium', description: 'My wireless mouse stopped working. Need a replacement.' },
      { subject: 'Monitor flickering', category: 'it', priority: 'high', description: 'My monitor keeps flickering which is causing eye strain.' },
      { subject: 'Salary credited late', category: 'payroll', priority: 'high', description: 'My salary for this month was credited 3 days late. Please check.' },
      { subject: 'Need parking space', category: 'admin', priority: 'low', description: 'Requesting a dedicated parking space as I commute by car daily.' },
      { subject: 'Attendance correction needed', category: 'hr', priority: 'medium', description: 'My attendance shows absent on 15th Dec but I was present in office.' },
      { subject: 'Printer not printing', category: 'it', priority: 'low', description: 'The printer on floor 3 is not printing documents. Shows offline.' },
      { subject: 'Expense reimbursement pending', category: 'payroll', priority: 'medium', description: 'My travel expense claim from last month is still pending.' },
      { subject: 'AC not working', category: 'admin', priority: 'medium', description: 'The AC in our bay area is not cooling properly.' }
    ];

    const hrEmployee = createdEmployees.find(e => e.role === 'hr') || createdEmployees[0];
    const ticketsToCreate = [];
    
    // Create at least one ticket per employee
    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const ticket = ticketSubjects[i % ticketSubjects.length];
      const statusRand = Math.random();
      const status = statusRand < 0.4 ? 'open' : (statusRand < 0.7 ? 'in-progress' : 'resolved');
      
      ticketsToCreate.push({
        employee_id: emp.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status,
        assigned_to: status !== 'open' ? hrEmployee.id : null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      });
    }
    
    // Add additional random tickets for more activity
    for (let i = 0; i < 30; i++) {
      const emp = getRandomElement(createdEmployees);
      const ticket = getRandomElement(ticketSubjects);
      const statusRand = Math.random();
      const status = statusRand < 0.3 ? 'open' : (statusRand < 0.6 ? 'in-progress' : 'resolved');
      
      ticketsToCreate.push({
        employee_id: emp.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status,
        assigned_to: status !== 'open' ? hrEmployee.id : null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      });
    }
    
    const { data: createdTickets, error: ticketError } = await supabase
      .from('helpdesk_tickets')
      .insert(ticketsToCreate)
      .select();
    if (ticketError) console.log(`Tickets error: ${ticketError.message}`);

    // Create messages for tickets (batch insert)
    if (createdTickets && createdTickets.length > 0) {
      const messagesToCreate = [];
      for (let i = 0; i < createdTickets.length; i++) {
        const ticket = createdTickets[i];
        const emp = createdEmployees.find(e => e.id === ticket.employee_id) || createdEmployees[0];
        messagesToCreate.push({
          ticket_id: ticket.id,
          sender_id: emp.id,
          message: `Hi, I need help with ${ticket.subject.toLowerCase()}. This is affecting my work.`
        });
        if (ticket.status !== 'open') {
          messagesToCreate.push({
            ticket_id: ticket.id,
            sender_id: createdEmployees[0].id,
            message: 'Thank you for reporting this. We are looking into it and will update you soon.'
          });
        }
      }
      const { error: msgError } = await supabase.from('ticket_messages').insert(messagesToCreate);
      if (msgError) console.log(`Ticket messages error: ${msgError.message}`);
    }
    console.log('Created helpdesk tickets');

    // Step 29: Create notifications
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

    // Step 30: Update department employee counts
    console.log('Updating department employee counts...');
    for (const [deptName, deptId] of deptMap) {
      const count = createdEmployees.filter(e => e.departmentId === deptId).length;
      await supabase.from('departments').update({ employee_count: count }).eq('id', deptId);
    }
    console.log('Updated department counts');

    // Step 31: Create asset categories
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

    // Step 32: Create assets
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

    // Step 33: Create asset assignments for assigned assets
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

    // Update assets with assigned_to using batch approach
    const assetUpdates = assignmentsToCreate.map(a => ({
      id: a.asset_id,
      assigned_to: a.employee_id,
      assigned_date: a.assigned_date
    }));
    
    // Process updates in parallel batches
    await Promise.all(
      assetUpdates.map(update => 
        supabase.from('assets').update({ 
          assigned_to: update.assigned_to,
          assigned_date: update.assigned_date 
        }).eq('id', update.id)
      )
    );

    const { error: assignError } = await supabase
      .from('asset_assignments')
      .insert(assignmentsToCreate);
    
    if (assignError) console.log(`Note: Asset assignments error: ${assignError.message}`);
    console.log(`Created ${assignmentsToCreate.length} asset assignments`);

    // Step 34: Create asset transfers
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

    // Step 35: Create asset maintenance records
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

    // Step 36: Create asset maintenance requests (employee-initiated)
    console.log('Creating asset maintenance requests...');
    const assetMaintenanceRequestsToCreate = [];
    const assignedAssetsList = createdAssets?.filter(a => a.status === 'assigned') || [];
    
    for (let i = 0; i < 20; i++) {
      const asset = assignedAssetsList[i % assignedAssetsList.length];
      const emp = createdEmployees[i % createdEmployees.length];
      const statusRand = Math.random();
      const status = statusRand < 0.25 ? 'pending' : (statusRand < 0.5 ? 'approved' : (statusRand < 0.75 ? 'in_progress' : 'completed'));
      const hrEmployee = createdEmployees.find(e => e.role === 'hr') || createdEmployees[0];
      
      assetMaintenanceRequestsToCreate.push({
        asset_id: asset.id,
        employee_id: emp.id,
        type: getRandomElement(['repair', 'service', 'replacement', 'upgrade']),
        description: getRandomElement([
          'Screen flickering issue',
          'Battery not holding charge',
          'Keyboard keys not working',
          'Device running slow, needs service',
          'Touchpad not responsive',
          'USB ports not working',
          'Software needs upgrade',
          'Device making noise'
        ]),
        priority: getRandomElement(['low', 'medium', 'high', 'urgent']),
        status,
        estimated_cost: Math.floor(Math.random() * 10000) + 1000,
        actual_cost: status === 'completed' ? Math.floor(Math.random() * 8000) + 1000 : null,
        scheduled_date: status !== 'pending' ? getRandomDate(new Date('2024-11-01'), new Date('2025-02-01')) : null,
        reviewed_by: status !== 'pending' ? hrEmployee.id : null,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
        review_comments: status === 'approved' ? 'Approved for maintenance' : (status === 'completed' ? 'Issue resolved' : null),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        resolution_notes: status === 'completed' ? 'Issue has been fixed. Device is working properly now.' : null
      });
    }
    
    const { error: amrError } = await supabase.from('asset_maintenance_requests').insert(assetMaintenanceRequestsToCreate);
    if (amrError) console.log(`Asset maintenance requests error: ${amrError.message}`);
    console.log(`Created ${assetMaintenanceRequestsToCreate.length} asset maintenance requests`);

    console.log('Database seeding completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully with comprehensive data',
        stats: {
          employees: createdEmployees.length,
          departments: createdDepts?.length || 0,
          designations: createdDesignations?.length || 0,
          stores: storeLocations.length,
          offices: officeLocations.length,
          leaveTypes: createdLeaveTypes?.length || 0,
          shifts: createdShifts?.length || 0,
          holidays: holidays2025.length,
          employeeTransfers: 10,
          letterTemplates: createdLetterTemplates?.length || 0,
          generatedLetters: generatedLettersToCreate.length,
          announcementTemplates: announcementTemplates.length,
          bannerTemplates: bannerTemplates.length,
          announcements: announcements.length,
          documents: documentsToCreate.length,
          attendanceRecords: attendanceRecordsToCreate.length,
          leaveRequests: leaveRequestsToCreate.length,
          payslips: payslipsToCreate.length,
          regularizationRequests: regularizationRequestsToCreate.length,
          profileChangeRequests: profileChangeRequestsToCreate.length,
          shiftExchangeRequests: shiftExchangeRequestsToCreate.length,
          helpdeskTickets: ticketsToCreate.length,
          assetCategories: createdCategories?.length || 0,
          assets: createdAssets?.length || 0,
          assetAssignments: assignmentsToCreate.length,
          assetTransfers: transfersToCreate.length,
          assetMaintenance: maintenanceToCreate.length,
          assetMaintenanceRequests: assetMaintenanceRequestsToCreate.length
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
