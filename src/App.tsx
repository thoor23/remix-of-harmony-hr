import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Unauthorized from "./pages/Unauthorized";

// Unified Layout
import { UnifiedLayout } from "./components/layout/UnifiedLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProfilePage from "./pages/admin/ProfilePage";
import EmployeeList from "./pages/admin/employees/EmployeeList";
import EmployeeDetails from "./pages/admin/employees/EmployeeDetails";
import AddEmployee from "./pages/admin/employees/AddEmployee";
import EditEmployee from "./pages/admin/employees/EditEmployee";
import AttendanceManagement from "./pages/admin/attendance/AttendanceManagement";
import AllAttendance from "./pages/admin/attendance/AllAttendance";
import AttendanceRegularizationPage from "./pages/admin/attendance/AttendanceRegularizationPage";
import LeaveOverview from "./pages/admin/leaves/LeaveOverview";
import AllLeaves from "./pages/admin/leaves/AllLeaves";
import LeaveManagement from "./pages/admin/leaves/LeaveManagement";
import LeavePolicy from "./pages/admin/leaves/LeavePolicy";
import SalaryStructure from "./pages/admin/payroll/SalaryStructure";
import PayslipsList from "./pages/admin/payroll/PayslipsList";
import PayslipTemplatesPage from "./pages/admin/payroll/PayslipTemplatesPage";
// File Manager Pages
import EmployeeDocumentsPage from "./pages/admin/file-manager/EmployeeDocumentsPage";
import EmployeeFolderPage from "./pages/admin/file-manager/EmployeeFolderPage";
import DocumentPoliciesPage from "./pages/admin/file-manager/DocumentPoliciesPage";
// Letter Pages
import OfferLetterPage from "./pages/admin/letters/OfferLetterPage";
import ExperienceLetterPage from "./pages/admin/letters/ExperienceLetterPage";
import RelievingLetterPage from "./pages/admin/letters/RelievingLetterPage";
import IncrementLetterPage from "./pages/admin/letters/IncrementLetterPage";
import LetterTemplatesPage from "./pages/admin/letters/LetterTemplatesPage";
import AnnouncementTemplatesPage from "./pages/admin/announcements/AnnouncementTemplatesPage";
import BannerTemplatesPage from "./pages/admin/announcements/BannerTemplatesPage";
import AnnouncementsPage from "./pages/admin/announcements/AnnouncementsPage";
import SendNotificationsPage from "./pages/admin/notifications/SendNotificationsPage";
import NotificationsPage from "./pages/admin/notifications/NotificationsPage";
import AllAuditLogs from "./pages/admin/audit/AllAuditLogs";
import EmployeeAuditLogs from "./pages/admin/audit/EmployeeAuditLogs";
import AttendanceAuditLogs from "./pages/admin/audit/AttendanceAuditLogs";
import LeaveAuditLogs from "./pages/admin/audit/LeaveAuditLogs";
import ShiftAuditLogs from "./pages/admin/audit/ShiftAuditLogs";
import PayrollAuditLogs from "./pages/admin/audit/PayrollAuditLogs";
import AssetAuditLogs from "./pages/admin/audit/AssetAuditLogs";
import HelpdeskAuditLogs from "./pages/admin/audit/HelpdeskAuditLogs";
import DocumentsAuditLogs from "./pages/admin/audit/DocumentsAuditLogs";
import LettersAuditLogs from "./pages/admin/audit/LettersAuditLogs";
import AnnouncementsAuditLogs from "./pages/admin/audit/AnnouncementsAuditLogs";
import TemplatesAuditLogs from "./pages/admin/audit/TemplatesAuditLogs";
import DepartmentsAuditLogs from "./pages/admin/audit/DepartmentsAuditLogs";
import DesignationsAuditLogs from "./pages/admin/audit/DesignationsAuditLogs";
import SettingsAuditLogs from "./pages/admin/audit/SettingsAuditLogs";
import AuthAuditLogs from "./pages/admin/audit/AuthAuditLogs";
import ProfileChangeRequestsPage from "./pages/admin/employees/ProfileChangeRequestsPage";
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
import StoreList from "./pages/admin/locations/stores/StoreList";
import AddStore from "./pages/admin/locations/stores/AddStore";
import EditStore from "./pages/admin/locations/stores/EditStore";
import StoreDetails from "./pages/admin/locations/stores/StoreDetails";
import StoreManagerDashboard from "./pages/admin/locations/stores/StoreManagerDashboard";
import OfficeList from "./pages/admin/locations/offices/OfficeList";
import AddOffice from "./pages/admin/locations/offices/AddOffice";
import EditOffice from "./pages/admin/locations/offices/EditOffice";
import OfficeDetails from "./pages/admin/locations/offices/OfficeDetails";
import OfficeDashboard from "./pages/admin/locations/offices/OfficeDashboard";
import EmployeeTransfers from "./pages/admin/locations/EmployeeTransfers";

// Asset Management Pages
import AssetList from "./pages/admin/assets/AssetList";
import AddAsset from "./pages/admin/assets/AddAsset";
import AssetDetails from "./pages/admin/assets/AssetDetails";
import EditAsset from "./pages/admin/assets/EditAsset";
import AssetCategories from "./pages/admin/assets/AssetCategories";
import AssetAssignments from "./pages/admin/assets/AssetAssignments";
import AssetTransfers from "./pages/admin/assets/AssetTransfers";
import AssetMaintenance from "./pages/admin/assets/AssetMaintenance";
import AssetReports from "./pages/admin/assets/AssetReports";

// Helpdesk Pages
import HelpdeskManagement from "./pages/admin/helpdesk/HelpdeskManagement";

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
import EmailSettingsPage from "./pages/admin/settings/EmailSettingsPage";
import EmailTemplatesPage from "./pages/admin/settings/EmailTemplatesPage";
import DataSeederPage from "./pages/admin/settings/DataSeederPage";
import PersonalSettingsPage from "./pages/admin/settings/PersonalSettingsPage";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeProfile from "./pages/employee/Profile";
import EmployeeProfileChangeRequests from "./pages/employee/ProfileChangeRequests";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeAttendanceRegularization from "./pages/employee/AttendanceRegularization";
import EmployeeLeaves from "./pages/employee/Leaves";
import EmployeeLeaveBalance from "./pages/employee/LeaveBalance";
import EmployeePayslips from "./pages/employee/Payslips";
import EmployeeDocuments from "./pages/employee/Documents";
import EmployeeAssets from "./pages/employee/Assets";
import EmployeeAssetMaintenanceRequests from "./pages/employee/AssetMaintenanceRequests";
import HolidayCalendar from "./pages/employee/Holidays";
import EmployeeHelpdesk from "./pages/employee/Helpdesk";
import EmployeeMyShift from "./pages/employee/MyShift";
import EmployeeAllShifts from "./pages/employee/AllShifts";
import EmployeeShiftExchange from "./pages/employee/ShiftExchange";
import EmployeeSettings from "./pages/employee/Settings";

// Employee Report Pages
import EmployeeAttendanceReport from "./pages/employee/reports/AttendanceReport";
import EmployeeShiftReport from "./pages/employee/reports/ShiftReport";
import EmployeeLeaveReport from "./pages/employee/reports/LeaveReport";
import EmployeePayrollReport from "./pages/employee/reports/PayrollReport";
import EmployeeDocumentsReport from "./pages/employee/reports/DocumentsReport";
import EmployeeAssetsReport from "./pages/employee/reports/AssetsReport";
import EmployeeHelpdeskReport from "./pages/employee/reports/HelpdeskReport";
import EmployeeExpensesReport from "./pages/employee/reports/ExpensesReport";

// Expense Management Pages
import ExpenseManagement from "./pages/admin/expenses/ExpenseManagement";
import ExpenseCategories from "./pages/admin/expenses/ExpenseCategories";
import ExpensePolicies from "./pages/admin/expenses/ExpensePolicies";
import ExpenseReports from "./pages/admin/reports/ExpenseReports";
import EmployeeExpenses from "./pages/employee/Expenses";

// Internal Billing Pages
import InvoiceList from "./pages/admin/internal-billing/InvoiceList";
import CreateInvoice from "./pages/admin/internal-billing/CreateInvoice";
import InvoiceDetails from "./pages/admin/internal-billing/InvoiceDetails";
import InvoiceCategories from "./pages/admin/internal-billing/InvoiceCategories";
import BillingReports from "./pages/admin/internal-billing/BillingReports";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DynamicFavicon />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider key="auth-provider">
            <PermissionProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Unified App Routes - Protected */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <UnifiedLayout />
                  </ProtectedRoute>
                }
              >
                {/* Admin Dashboard */}
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="personal-settings" element={<PersonalSettingsPage />} />
                
                {/* Employee Dashboard */}
                <Route path="my-dashboard" element={<EmployeeDashboard />} />
                <Route path="my-profile" element={<EmployeeProfile />} />
                <Route path="my-profile/change-requests" element={<EmployeeProfileChangeRequests />} />
                
                {/* Employees Management */}
                <Route path="employees" element={<EmployeeList />} />
                <Route path="employees/new" element={<AddEmployee />} />
                <Route path="employees/:id" element={<EmployeeDetails />} />
                <Route path="employees/:id/edit" element={<EditEmployee />} />
                <Route path="employees/change-requests" element={<ProfileChangeRequestsPage />} />
                
                {/* Attendance */}
                <Route path="attendance" element={<AttendanceManagement />} />
                <Route path="attendance/all" element={<AllAttendance />} />
                <Route path="attendance/regularization" element={<AttendanceRegularizationPage />} />
                <Route path="attendance/policy" element={<AttendancePolicyPage />} />
                {/* My Attendance */}
                <Route path="my-attendance" element={<EmployeeAttendance />} />
                <Route path="my-attendance/log" element={<EmployeeAttendance />} />
                <Route path="my-attendance/regularization" element={<EmployeeAttendanceRegularization />} />
                <Route path="my-attendance/report" element={<EmployeeAttendanceReport />} />
                
                {/* Leaves */}
                <Route path="leaves" element={<LeaveOverview />} />
                <Route path="leaves/all" element={<AllLeaves />} />
                <Route path="leaves/requests" element={<LeaveManagement />} />
                <Route path="leaves/policy" element={<LeavePolicy />} />
                {/* My Leaves */}
                <Route path="my-leaves" element={<EmployeeLeaves />} />
                <Route path="my-leaves/apply" element={<EmployeeLeaves />} />
                <Route path="my-leaves/history" element={<EmployeeLeaves />} />
                <Route path="my-leaves/balance" element={<EmployeeLeaveBalance />} />
                <Route path="my-leaves/report" element={<EmployeeLeaveReport />} />
                
                {/* Payroll */}
                <Route path="payroll/structure" element={<SalaryStructure />} />
                <Route path="payroll/payslips" element={<PayslipsList />} />
                <Route path="payroll/templates" element={<PayslipTemplatesPage />} />
                {/* My Payroll */}
                <Route path="my-payslips" element={<EmployeePayslips />} />
                <Route path="my-payslips/salary" element={<EmployeePayslips />} />
                <Route path="my-payroll/report" element={<EmployeePayrollReport />} />
                
                {/* File Manager */}
                <Route path="file-manager" element={<EmployeeDocumentsPage />} />
                <Route path="file-manager/:employeeId" element={<EmployeeFolderPage />} />
                <Route path="file-manager/policies" element={<DocumentPoliciesPage />} />
                {/* My Documents */}
                <Route path="my-documents" element={<EmployeeDocuments />} />
                <Route path="my-documents/personal" element={<EmployeeDocuments />} />
                <Route path="my-documents/policies" element={<EmployeeDocuments />} />
                <Route path="my-documents/report" element={<EmployeeDocumentsReport />} />
                
                {/* Letters */}
                <Route path="letters/offer" element={<OfferLetterPage />} />
                <Route path="letters/experience" element={<ExperienceLetterPage />} />
                <Route path="letters/relieving" element={<RelievingLetterPage />} />
                <Route path="letters/increment" element={<IncrementLetterPage />} />
                <Route path="letters/templates" element={<LetterTemplatesPage />} />
                
                {/* Announcements */}
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="announcements/templates" element={<AnnouncementTemplatesPage />} />
                <Route path="announcements/banner-templates" element={<BannerTemplatesPage />} />
                
                {/* Notifications */}
                <Route path="notifications/send" element={<SendNotificationsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                
                {/* Audit Logs */}
                <Route path="audit-logs" element={<AllAuditLogs />} />
                <Route path="audit-logs/employee" element={<EmployeeAuditLogs />} />
                <Route path="audit-logs/attendance" element={<AttendanceAuditLogs />} />
                <Route path="audit-logs/leave" element={<LeaveAuditLogs />} />
                <Route path="audit-logs/shift" element={<ShiftAuditLogs />} />
                <Route path="audit-logs/payroll" element={<PayrollAuditLogs />} />
                <Route path="audit-logs/asset" element={<AssetAuditLogs />} />
                <Route path="audit-logs/helpdesk" element={<HelpdeskAuditLogs />} />
                <Route path="audit-logs/documents" element={<DocumentsAuditLogs />} />
                <Route path="audit-logs/letters" element={<LettersAuditLogs />} />
                <Route path="audit-logs/announcements" element={<AnnouncementsAuditLogs />} />
                <Route path="audit-logs/templates" element={<TemplatesAuditLogs />} />
                <Route path="audit-logs/departments" element={<DepartmentsAuditLogs />} />
                <Route path="audit-logs/designations" element={<DesignationsAuditLogs />} />
                <Route path="audit-logs/settings" element={<SettingsAuditLogs />} />
                <Route path="audit-logs/auth" element={<AuthAuditLogs />} />
                
                {/* Reports */}
                <Route path="reports" element={<ReportsOverview />} />
                <Route path="reports/employee" element={<EmployeeReports />} />
                <Route path="reports/attendance" element={<AttendanceReports />} />
                <Route path="reports/leave" element={<LeaveReports />} />
                <Route path="reports/payroll" element={<PayrollReports />} />
                <Route path="reports/expenses" element={<ExpenseReports />} />
                
                {/* Expenses */}
                <Route path="expenses" element={<ExpenseManagement />} />
                <Route path="expenses/categories" element={<ExpenseCategories />} />
                <Route path="expenses/policies" element={<ExpensePolicies />} />
                {/* My Expenses */}
                <Route path="my-expenses" element={<EmployeeExpenses />} />
                <Route path="my-expenses/report" element={<EmployeeExpensesReport />} />
                
                {/* Internal Billing */}
                <Route path="internal-billing/invoices" element={<InvoiceList />} />
                <Route path="internal-billing/invoices/create" element={<CreateInvoice />} />
                <Route path="internal-billing/invoices/add" element={<CreateInvoice />} />
                <Route path="internal-billing/invoices/:id" element={<InvoiceDetails />} />
                <Route path="internal-billing/categories" element={<InvoiceCategories />} />
                <Route path="internal-billing/reports" element={<BillingReports />} />
                
                {/* Shifts */}
                <Route path="shifts" element={<ShiftList />} />
                <Route path="shifts/assignments" element={<ShiftAssignments />} />
                <Route path="shifts/rotations" element={<ShiftRotations />} />
                <Route path="shifts/exchange" element={<ShiftExchange />} />
                <Route path="shifts/calendar" element={<ShiftCalendar />} />
                <Route path="shifts/policy" element={<ShiftPolicyPage />} />
                {/* My Shifts */}
                <Route path="my-shifts" element={<EmployeeMyShift />} />
                <Route path="all-shifts" element={<EmployeeAllShifts />} />
                <Route path="my-shift-exchange" element={<EmployeeShiftExchange />} />
                <Route path="my-shifts/report" element={<EmployeeShiftReport />} />
                
                {/* Locations - Stores */}
                <Route path="locations/stores" element={<StoreList />} />
                <Route path="locations/stores/add" element={<AddStore />} />
                <Route path="locations/stores/dashboard" element={<StoreManagerDashboard />} />
                <Route path="locations/stores/:id" element={<StoreDetails />} />
                <Route path="locations/stores/:id/edit" element={<EditStore />} />
                {/* Locations - Offices */}
                <Route path="locations/offices" element={<OfficeList />} />
                <Route path="locations/offices/add" element={<AddOffice />} />
                <Route path="locations/offices/dashboard" element={<OfficeDashboard />} />
                <Route path="locations/offices/:id" element={<OfficeDetails />} />
                <Route path="locations/offices/:id/edit" element={<EditOffice />} />
                {/* Locations - Transfers */}
                <Route path="locations/transfers" element={<EmployeeTransfers />} />
                
                {/* Asset Management */}
                <Route path="assets" element={<AssetList />} />
                <Route path="assets/add" element={<AddAsset />} />
                <Route path="assets/:id" element={<AssetDetails />} />
                <Route path="assets/:id/edit" element={<EditAsset />} />
                <Route path="assets/categories" element={<AssetCategories />} />
                <Route path="assets/assignments" element={<AssetAssignments />} />
                <Route path="assets/transfers" element={<AssetTransfers />} />
                <Route path="assets/maintenance" element={<AssetMaintenance />} />
                <Route path="assets/reports" element={<AssetReports />} />
                {/* My Assets */}
                <Route path="my-assets" element={<EmployeeAssets />} />
                <Route path="my-assets/maintenance" element={<EmployeeAssetMaintenanceRequests />} />
                <Route path="my-asset-maintenance" element={<EmployeeAssetMaintenanceRequests />} />
                <Route path="my-assets/report" element={<EmployeeAssetsReport />} />
                
                {/* Helpdesk */}
                <Route path="helpdesk" element={<HelpdeskManagement />} />
                {/* My Helpdesk */}
                <Route path="my-helpdesk" element={<EmployeeHelpdesk />} />
                <Route path="my-helpdesk/new" element={<EmployeeHelpdesk />} />
                <Route path="my-helpdesk/tickets" element={<EmployeeHelpdesk />} />
                <Route path="my-helpdesk/report" element={<EmployeeHelpdeskReport />} />
                
                {/* Holidays */}
                <Route path="holidays" element={<HolidayCalendar />} />
                
                {/* Settings */}
                <Route path="settings" element={<EmployeeSettings />} />
                <Route path="settings/departments" element={<DepartmentsPage />} />
                <Route path="settings/designations" element={<DesignationsPage />} />
                <Route path="settings/roles" element={<RolesPage />} />
                <Route path="settings/company" element={<CompanySettingsPage />} />
                <Route path="settings/notifications" element={<NotificationSettingsPage />} />
                <Route path="settings/email" element={<EmailSettingsPage />} />
                <Route path="settings/email-templates" element={<EmailTemplatesPage />} />
                <Route path="settings/system" element={<SystemSettingsPage />} />
                <Route path="settings/appearance" element={<AppearancePage />} />
                <Route path="settings/seeder" element={<DataSeederPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
              </Routes>
            </PermissionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
