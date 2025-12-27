import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Layouts
import { AdminLayout } from "./components/layout/AdminLayout";
import { EmployeeLayout } from "./components/layout/EmployeeLayout";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import EmployeeList from "./pages/admin/employees/EmployeeList";
import EmployeeDetails from "./pages/admin/employees/EmployeeDetails";
import AddEmployee from "./pages/admin/employees/AddEmployee";
import AttendanceManagement from "./pages/admin/attendance/AttendanceManagement";
import LeaveManagement from "./pages/admin/leaves/LeaveManagement";
import LeavePolicy from "./pages/admin/leaves/LeavePolicy";
import SalaryStructure from "./pages/admin/payroll/SalaryStructure";
import PayslipsList from "./pages/admin/payroll/PayslipsList";
import DocumentsManagement from "./pages/admin/documents/DocumentsManagement";
import AnnouncementsManagement from "./pages/admin/announcements/AnnouncementsManagement";
import AuditLogs from "./pages/admin/audit/AuditLogs";
import SettingsPage from "./pages/admin/settings/SettingsPage";

// Employee Pages
import EmployeeLogin from "./pages/employee/Login";
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeProfile from "./pages/employee/Profile";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeLeaves from "./pages/employee/Leaves";
import EmployeePayslips from "./pages/employee/Payslips";
import EmployeeDocuments from "./pages/employee/Documents";
import HolidayCalendar from "./pages/employee/Holidays";
import EmployeeHelpdesk from "./pages/employee/Helpdesk";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<AddEmployee />} />
            <Route path="employees/:id" element={<EmployeeDetails />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="leaves" element={<LeaveManagement />} />
            <Route path="leaves/policy" element={<LeavePolicy />} />
            <Route path="payroll/structure" element={<SalaryStructure />} />
            <Route path="payroll/payslips" element={<PayslipsList />} />
            <Route path="documents" element={<DocumentsManagement />} />
            <Route path="announcements" element={<AnnouncementsManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings/*" element={<SettingsPage />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="payslips" element={<EmployeePayslips />} />
            <Route path="documents" element={<EmployeeDocuments />} />
            <Route path="holidays" element={<HolidayCalendar />} />
            <Route path="helpdesk" element={<EmployeeHelpdesk />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
