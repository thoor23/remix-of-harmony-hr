import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

// Layouts
import { AdminLayout } from "./components/layout/AdminLayout";
import { EmployeeLayout } from "./components/layout/EmployeeLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProfilePage from "./pages/admin/ProfilePage";
import EmployeeList from "./pages/admin/employees/EmployeeList";
import EmployeeDetails from "./pages/admin/employees/EmployeeDetails";
import AddEmployee from "./pages/admin/employees/AddEmployee";
import EditEmployee from "./pages/admin/employees/EditEmployee";
import AttendanceManagement from "./pages/admin/attendance/AttendanceManagement";
import LeaveManagement from "./pages/admin/leaves/LeaveManagement";
import LeavePolicy from "./pages/admin/leaves/LeavePolicy";
import SalaryStructure from "./pages/admin/payroll/SalaryStructure";
import PayslipsList from "./pages/admin/payroll/PayslipsList";
import DocumentsManagement from "./pages/admin/documents/DocumentsManagement";
import AnnouncementsManagement from "./pages/admin/announcements/AnnouncementsManagement";
import AuditLogs from "./pages/admin/audit/AuditLogs";
import ReportsOverview from "./pages/admin/reports/ReportsOverview";
import EmployeeReports from "./pages/admin/reports/EmployeeReports";
import AttendanceReports from "./pages/admin/reports/AttendanceReports";
import LeaveReports from "./pages/admin/reports/LeaveReports";
import PayrollReports from "./pages/admin/reports/PayrollReports";
import ShiftList from "./pages/admin/shifts/ShiftList";
import ShiftAssignments from "./pages/admin/shifts/ShiftAssignments";
import ShiftRotations from "./pages/admin/shifts/ShiftRotations";
import ShiftCalendar from "./pages/admin/shifts/ShiftCalendar";
import ShiftExchange from "./pages/admin/shifts/ShiftExchange";

// Settings Pages
import DepartmentsPage from "./pages/admin/settings/DepartmentsPage";
import DesignationsPage from "./pages/admin/settings/DesignationsPage";
import RolesPage from "./pages/admin/settings/RolesPage";
import CompanySettingsPage from "./pages/admin/settings/CompanySettingsPage";
import AttendancePolicyPage from "./pages/admin/attendance/AttendancePolicyPage";
import ShiftPolicyPage from "./pages/admin/shifts/ShiftPolicyPage";
import NotificationSettingsPage from "./pages/admin/settings/NotificationSettingsPage";
import SystemSettingsPage from "./pages/admin/settings/SystemSettingsPage";
import AppearancePage from "./pages/admin/settings/AppearancePage";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeProfile from "./pages/employee/Profile";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeLeaves from "./pages/employee/Leaves";
import EmployeePayslips from "./pages/employee/Payslips";
import EmployeeDocuments from "./pages/employee/Documents";
import HolidayCalendar from "./pages/employee/Holidays";
import EmployeeHelpdesk from "./pages/employee/Helpdesk";
import EmployeeShiftExchange from "./pages/employee/ShiftExchange";
import EmployeeSettings from "./pages/employee/Settings";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Admin Routes - Protected */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hr", "manager"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="employees/new" element={<AddEmployee />} />
                <Route path="employees/:id" element={<EmployeeDetails />} />
                <Route path="employees/:id/edit" element={<EditEmployee />} />
                <Route path="attendance" element={<AttendanceManagement />} />
                <Route path="attendance/policy" element={<AttendancePolicyPage />} />
                <Route path="leaves" element={<LeaveManagement />} />
                <Route path="leaves/policy" element={<LeavePolicy />} />
                <Route path="payroll/structure" element={<SalaryStructure />} />
                <Route path="payroll/payslips" element={<PayslipsList />} />
                <Route path="documents" element={<DocumentsManagement />} />
                <Route path="announcements" element={<AnnouncementsManagement />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="reports" element={<ReportsOverview />} />
                <Route path="reports/employee" element={<EmployeeReports />} />
                <Route path="reports/attendance" element={<AttendanceReports />} />
                <Route path="reports/leave" element={<LeaveReports />} />
                <Route path="reports/payroll" element={<PayrollReports />} />
                <Route path="shifts" element={<ShiftList />} />
                <Route path="shifts/assignments" element={<ShiftAssignments />} />
                <Route path="shifts/rotations" element={<ShiftRotations />} />
                <Route path="shifts/exchange" element={<ShiftExchange />} />
                <Route path="shifts/calendar" element={<ShiftCalendar />} />
                <Route path="shifts/policy" element={<ShiftPolicyPage />} />
                {/* Settings Routes */}
                <Route path="settings/departments" element={<DepartmentsPage />} />
                <Route path="settings/designations" element={<DesignationsPage />} />
                <Route path="settings/roles" element={<RolesPage />} />
                <Route path="settings/company" element={<CompanySettingsPage />} />
                <Route path="settings/notifications" element={<NotificationSettingsPage />} />
                <Route path="settings/system" element={<SystemSettingsPage />} />
                <Route path="settings/appearance" element={<AppearancePage />} />
              </Route>

              {/* Employee Routes - Protected */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="leaves" element={<EmployeeLeaves />} />
                <Route path="shift-exchange" element={<EmployeeShiftExchange />} />
                <Route path="payslips" element={<EmployeePayslips />} />
                <Route path="documents" element={<EmployeeDocuments />} />
                <Route path="holidays" element={<HolidayCalendar />} />
                <Route path="helpdesk" element={<EmployeeHelpdesk />} />
                <Route path="settings" element={<EmployeeSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
