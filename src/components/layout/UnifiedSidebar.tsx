import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  LayoutDashboard,
  Users,
  Users2,
  UserPlus,
  FileText,
  Megaphone,
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  ClipboardEdit,
  ArrowLeftRight,
  Banknote,
  Receipt,
  PieChart,
  Building,
  BadgeCheck,
  Shield,
  Settings2,
  Bell,
  Palette,
  Store,
  MapPin,
  FolderOpen,
  Folders,
  FileStack,
  Mail,
  FilePlus,
  Award,
  FileOutput,
  TrendingUp,
  LayoutTemplate,
  CalendarClock,
  ClipboardPen,
  Scale,
  Fingerprint,
  UserCheck,
  Repeat,
  CalendarRange,
  Gavel,
  ListChecks,
  ChartPie,
  FileSpreadsheet,
  ScrollText,
  TimerReset,
  CalendarOff,
  FileSignature,
  Cog,
  BellRing,
  CalendarDays,
  CalendarCheck,
  LayoutGrid,
  Package,
  PackagePlus,
  Tags,
  Wrench,
  Database,
  Headset,
  Ticket,
  Send,
  User,
  Wallet,
  Calendar,
  HelpCircle,
  Settings,
  Clock,
  History,
  Eye,
  UserCircle,
  Briefcase,
  Activity,
} from "lucide-react";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/contexts/PermissionContext";

const fontWeightClasses = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: { title: string; href: string; icon: React.ElementType }[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Unified navigation - combines Admin and Employee modules
// Items will be filtered based on user permissions
const unifiedNavSections: NavSection[] = [
  {
    label: "Dashboard",
    items: [
      // Single Dashboard item - href will be set dynamically based on roleType
      { title: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My Workspace",
    items: [
      {
        title: "My Attendance",
        icon: CalendarDays,
        children: [
          { title: "Attendance Records", href: "/app/my-attendance", icon: Clock },
          { title: "Regularization Requests", href: "/app/my-attendance/regularization", icon: ClipboardEdit },
          { title: "My Report", href: "/app/my-attendance/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Shifts",
        icon: Clock,
        children: [
          { title: "My Schedule", href: "/app/my-shifts", icon: Eye },
          { title: "All Shifts", href: "/app/all-shifts", icon: Users },
          { title: "Exchange Requests", href: "/app/my-shift-exchange", icon: ArrowLeftRight },
          { title: "My Report", href: "/app/my-shifts/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Leaves",
        icon: CalendarCheck,
        children: [
          { title: "Leave Records", href: "/app/my-leaves", icon: History },
          { title: "Leave Balance", href: "/app/my-leaves/balance", icon: PieChart },
          { title: "My Report", href: "/app/my-leaves/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Payslips",
        icon: Wallet,
        children: [
          { title: "Payslip Records", href: "/app/my-payslips", icon: Receipt },
          { title: "My Report", href: "/app/my-payroll/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Expenses",
        icon: Receipt,
        children: [
          { title: "My Claims", href: "/app/my-expenses", icon: Receipt },
          { title: "My Report", href: "/app/my-expenses/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Documents",
        icon: FileText,
        children: [
          { title: "Documents", href: "/app/my-documents", icon: FolderOpen },
          { title: "My Report", href: "/app/my-documents/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Assets",
        icon: Package,
        children: [
          { title: "Assigned Assets", href: "/app/my-assets", icon: Package },
          { title: "Maintenance Requests", href: "/app/my-assets/maintenance", icon: Wrench },
          { title: "My Report", href: "/app/my-assets/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Helpdesk",
        icon: HelpCircle,
        children: [
          { title: "My Tickets", href: "/app/my-helpdesk", icon: Ticket },
          { title: "My Report", href: "/app/my-helpdesk/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Profile",
        icon: UserCircle,
        children: [
          { title: "Profile Details", href: "/app/my-profile", icon: User },
          { title: "Change Requests", href: "/app/my-profile/change-requests", icon: ClipboardEdit },
        ],
      },
      { title: "Holidays", href: "/app/holidays", icon: Calendar },
      { title: "My Settings", href: "/app/settings", icon: Settings },
    ],
  },
  {
    label: "Core Operations",
    items: [
      {
        title: "Employees",
        icon: Users,
        children: [
          { title: "Employee Directory", href: "/app/employees", icon: Users2 },
          { title: "Add New Employee", href: "/app/employees/new", icon: UserPlus },
          { title: "Profile Change Requests", href: "/app/employees/change-requests", icon: ClipboardCheck },
        ],
      },
      {
        title: "Attendance",
        icon: Fingerprint,
        children: [
          { title: "Overview", href: "/app/attendance", icon: ChartPie },
          { title: "Attendance Records", href: "/app/attendance/all", icon: CalendarClock },
          { title: "Regularization Requests", href: "/app/attendance/regularization", icon: ClipboardEdit },
          { title: "Attendance Policies", href: "/app/attendance/policy", icon: Gavel },
        ],
      },
      {
        title: "Leaves",
        icon: CalendarOff,
        children: [
          { title: "Overview", href: "/app/leaves", icon: PieChart },
          { title: "Leave Records", href: "/app/leaves/all", icon: CalendarClock },
          { title: "Leave Applications", href: "/app/leaves/requests", icon: ClipboardPen },
          { title: "Leave Policies", href: "/app/leaves/policy", icon: Scale },
        ],
      },
      {
        title: "Shifts",
        icon: TimerReset,
        children: [
          { title: "Shift Schedule", href: "/app/shifts", icon: ListChecks },
          { title: "Shift Assignments", href: "/app/shifts/assignments", icon: UserCheck },
          { title: "Shift Rotations", href: "/app/shifts/rotations", icon: Repeat },
          { title: "Shift Exchange", href: "/app/shifts/exchange", icon: ArrowLeftRight },
          { title: "Shift Calendar", href: "/app/shifts/calendar", icon: CalendarRange },
          { title: "Shift Policies", href: "/app/shifts/policy", icon: Gavel },
        ],
      },
      {
        title: "Recruitment",
        icon: Briefcase,
        children: [
          { title: "Dashboard", href: "/app/recruitment", icon: LayoutDashboard },
          { title: "Job Openings", href: "/app/recruitment/jobs", icon: FileText },
          { title: "Applications", href: "/app/recruitment/applications", icon: Users },
          { title: "Interviews", href: "/app/recruitment/interviews", icon: Calendar },
          { title: "Calendar", href: "/app/recruitment/interviews/calendar", icon: CalendarDays },
          { title: "Analytics", href: "/app/recruitment/analytics", icon: BarChart3 },
        ],
      },
      {
        title: "Onboarding",
        icon: UserPlus,
        children: [
          { title: "Dashboard", href: "/app/onboarding", icon: LayoutDashboard },
          { title: "Start Onboarding", href: "/app/onboarding/start", icon: UserPlus },
          { title: "Templates", href: "/app/onboarding/templates", icon: LayoutTemplate },
        ],
      },
      {
        title: "Offboarding",
        icon: FileOutput,
        children: [
          { title: "Dashboard", href: "/app/offboarding", icon: LayoutDashboard },
          { title: "Initiate Exit", href: "/app/offboarding/initiate", icon: FileOutput },
        ],
      },
    ],
  },
  {
    label: "Financial",
    items: [
      {
        title: "Payroll",
        icon: Banknote,
        children: [
          { title: "Salary Configuration", href: "/app/payroll/structure", icon: FileSpreadsheet },
          { title: "Payslip Records", href: "/app/payroll/payslips", icon: Receipt },
        ],
      },
      {
        title: "Expenses",
        icon: Wallet,
        children: [
          { title: "Expense Claims", href: "/app/expenses", icon: Receipt },
          { title: "Expense Categories", href: "/app/expenses/categories", icon: Tags },
          { title: "Expense Policies", href: "/app/expenses/policies", icon: Gavel },
          { title: "Expense Reports", href: "/app/reports/expenses", icon: BarChart3 },
        ],
      },
      {
        title: "Internal Billing",
        icon: Receipt,
        children: [
          { title: "Invoices", href: "/app/internal-billing/invoices", icon: FileText },
          { title: "Create Invoice", href: "/app/internal-billing/invoices/add", icon: FilePlus },
          { title: "Categories", href: "/app/internal-billing/categories", icon: Tags },
          { title: "Billing Reports", href: "/app/internal-billing/reports", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        title: "Locations",
        icon: MapPin,
        children: [
          { title: "Store Directory", href: "/app/locations/stores", icon: Store },
          { title: "Store Dashboard", href: "/app/locations/stores/dashboard", icon: LayoutGrid },
          { title: "Office Directory", href: "/app/locations/offices", icon: Building2 },
          { title: "Office Dashboard", href: "/app/locations/offices/dashboard", icon: LayoutGrid },
          { title: "Employee Transfers", href: "/app/locations/transfers", icon: ArrowLeftRight },
        ],
      },
      {
        title: "Assets",
        icon: Package,
        children: [
          { title: "Asset Inventory", href: "/app/assets", icon: Package },
          { title: "Add New Asset", href: "/app/assets/add", icon: PackagePlus },
          { title: "Asset Categories", href: "/app/assets/categories", icon: Tags },
          { title: "Asset Assignments", href: "/app/assets/assignments", icon: UserCheck },
          { title: "Asset Transfers", href: "/app/assets/transfers", icon: ArrowLeftRight },
          { title: "Asset Maintenance", href: "/app/assets/maintenance", icon: Wrench },
          { title: "Asset Reports", href: "/app/assets/reports", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Documentation",
    items: [
      {
        title: "Documents",
        icon: FolderOpen,
        children: [
          { title: "Employee Files", href: "/app/file-manager", icon: Folders },
          { title: "Document Policies", href: "/app/file-manager/policies", icon: FileStack },
        ],
      },
      {
        title: "Letters",
        icon: FileSignature,
        children: [
          { title: "Offer Letter", href: "/app/letters/offer", icon: FilePlus },
          { title: "Experience Letter", href: "/app/letters/experience", icon: Award },
          { title: "Relieving Letter", href: "/app/letters/relieving", icon: FileOutput },
          { title: "Increment Letter", href: "/app/letters/increment", icon: TrendingUp },
        ],
      },
      {
        title: "Templates",
        icon: LayoutTemplate,
        children: [
          { title: "Payslip Templates", href: "/app/payroll/templates", icon: Receipt },
          { title: "Letter Templates", href: "/app/letters/templates", icon: FileText },
          { title: "Announcement Templates", href: "/app/announcements/templates", icon: Megaphone },
          { title: "Banner Templates", href: "/app/announcements/banner-templates", icon: Palette },
          { title: "Email Templates", href: "/app/settings/email-templates", icon: Mail },
        ],
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        title: "Helpdesk",
        icon: Headset,
        children: [
          { title: "All Tickets", href: "/app/helpdesk", icon: Ticket },
        ],
      },
      {
        title: "Announcements",
        icon: BellRing,
        children: [
          { title: "All Announcements", href: "/app/announcements", icon: Megaphone },
          { title: "Send Notifications", href: "/app/notifications/send", icon: Send },
        ],
      },
    ],
  },
  {
    label: "Analytics & Settings",
    items: [
      {
        title: "Reports",
        icon: BarChart3,
        children: [
          { title: "Reports Overview", href: "/app/reports", icon: ChartPie },
          { title: "Employee Reports", href: "/app/reports/employee", icon: Users2 },
          { title: "Attendance Reports", href: "/app/reports/attendance", icon: CalendarDays },
          { title: "Leave Reports", href: "/app/reports/leave", icon: CalendarCheck },
          { title: "Payroll Reports", href: "/app/reports/payroll", icon: PieChart },
        ],
      },
      {
        title: "Settings",
        icon: Building2,
        children: [
          { title: "Company Branding", href: "/app/settings/company", icon: Building2 },
          { title: "Departments", href: "/app/settings/departments", icon: Building },
          { title: "Designations", href: "/app/settings/designations", icon: BadgeCheck },
          { title: "Roles & Permissions", href: "/app/settings/roles", icon: Shield },
          { title: "Notification Settings", href: "/app/settings/notifications", icon: Bell },
          { title: "Email Configuration", href: "/app/settings/email", icon: Mail },
          { title: "System Preferences", href: "/app/settings/system", icon: Settings2 },
          { title: "Data Management", href: "/app/settings/seeder", icon: Database },
          { title: "Server Status", href: "/app/settings/server-status", icon: Activity },
        ],
      },
      {
        title: "Audit Logs",
        icon: ScrollText,
        children: [
          { title: "All Logs", href: "/app/audit-logs", icon: FileText },
          { title: "Employee Logs", href: "/app/audit-logs/employee", icon: Users2 },
          { title: "Attendance Logs", href: "/app/audit-logs/attendance", icon: Fingerprint },
          { title: "Leave Logs", href: "/app/audit-logs/leave", icon: CalendarOff },
          { title: "Shift Logs", href: "/app/audit-logs/shift", icon: TimerReset },
          { title: "Payroll Logs", href: "/app/audit-logs/payroll", icon: Banknote },
          { title: "Asset Logs", href: "/app/audit-logs/asset", icon: Package },
          { title: "Helpdesk Logs", href: "/app/audit-logs/helpdesk", icon: Headset },
          { title: "Settings Logs", href: "/app/audit-logs/settings", icon: Cog },
          { title: "Auth Logs", href: "/app/audit-logs/auth", icon: Shield },
        ],
      },
    ],
  },
];

// Map navigation items to their corresponding RBAC modules
const navItemToModule: Record<string, string> = {
  // Dashboard - single unified item
  "Dashboard": "Dashboard",
  // Employee modules
  "My Attendance": "My Attendance",
  "My Shifts": "My Shifts",
  "My Leaves": "My Leaves",
  "My Payslips": "My Payslips",
  "My Documents": "My Documents",
  "My Assets": "My Assets",
  "My Helpdesk": "My Helpdesk",
  "My Profile": "My Profile",
  "My Settings": "My Settings",
  // Admin modules
  "Employees": "Employees",
  "Attendance": "Attendance",
  "Leaves": "Leaves",
  "Shifts": "Shifts",
  "Payroll": "Payroll",
  "Expenses": "Expenses",
  "My Expenses": "My Expenses",
  "Internal Billing": "Internal Billing",
  "Documents": "Documents",
  "Assets": "Assets",
  "Locations": "Locations",
  "Helpdesk": "Helpdesk",
  "Announcements": "Announcements",
  "Reports": "Reports",
  "Settings": "Settings",
  "Templates": "Templates",
  "Letters": "Documents",
  "Audit Logs": "Audit Logs",
  "Holidays": "Holidays",
  "Recruitment": "Recruitment",
  "Onboarding": "Onboarding",
  "Offboarding": "Offboarding",
};

interface UnifiedSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function UnifiedSidebar({ collapsed, onCollapsedChange }: UnifiedSidebarProps) {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { data: branding } = useCompanyBranding();
  const { canRead, permissions, loading: permLoading, roleType } = usePermissions();

  // Define which sections are for which role type
  const adminOnlySections = ["Core Operations", "Financial", "Resources", "Documentation", "Communication", "Analytics & Settings"];
  const employeeOnlySections = ["My Workspace"];

  // Filter navigation based on permissions and roleType
  const filteredNavSections = useMemo(() => {
    // Return empty array while loading
    if (permLoading) {
      return [];
    }

    // If no permissions but user is authenticated, show at least Dashboard
    if (permissions.length === 0) {
      return [{
        label: "Dashboard",
        items: [{ 
          title: "Dashboard", 
          href: roleType === "employee" ? "/app/my-dashboard" : "/app/dashboard", 
          icon: LayoutDashboard 
        }],
      }];
    }

    return unifiedNavSections
      // STEP 1: Filter sections by roleType
      .filter(section => {
        // Employee should NOT see admin-only sections
        if (roleType === 'employee' && adminOnlySections.includes(section.label)) {
          return false;
        }
        // Admin should NOT see employee-only sections
        if (roleType === 'admin' && employeeOnlySections.includes(section.label)) {
          return false;
        }
        return true;
      })
      // STEP 2: Then filter items by permissions
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const module = navItemToModule[item.title];
          if (!module) return true;
          return canRead(module);
        }).map(item => {
          // Set Dashboard href dynamically based on roleType
          if (item.title === "Dashboard") {
            return {
              ...item,
              href: roleType === "employee" ? "/app/my-dashboard" : "/app/dashboard",
            };
          }
          if (item.children) {
            return {
              ...item,
              children: item.children
            };
          }
          return item;
        }).filter(item => !item.children || item.children.length > 0)
      }))
      .filter(section => section.items.length > 0);
  }, [permissions, permLoading, canRead, roleType]);

  useEffect(() => {
    if (collapsed) {
      setOpenItems([]);
    }
  }, [collapsed]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => location.pathname === child.href || location.pathname.startsWith(child.href + "/"));

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b">
        <Avatar 
          className="rounded-lg flex-shrink-0"
          style={{ width: branding?.logoSize || 32, height: branding?.logoSize || 32 }}
        >
          <AvatarImage src={branding?.companyLogo || undefined} alt={branding?.companyName || "Company"} />
          <AvatarFallback className="rounded-lg bg-primary">
            <Building2 style={{ width: (branding?.logoSize || 32) / 2, height: (branding?.logoSize || 32) / 2 }} className="text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <span 
            className={cn(
              "truncate leading-none",
              fontWeightClasses[branding?.nameFontWeight || "semibold"],
              branding?.nameItalic && "italic"
            )}
            style={{ fontSize: branding?.nameSize || 18 }}
          >
            {branding?.companyName || "HRMS Portal"}
          </span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <TooltipProvider delayDuration={0}>
          <nav className="px-2">
            {filteredNavSections.map((section, sectionIndex) => (
              <div key={section.label} className={cn(sectionIndex > 0 && "mt-4")}>
                {!collapsed && (
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.children) {
                      const isOpen = openItems.includes(item.title);
                      const hasActiveChild = isChildActive(item.children);

                      if (collapsed) {
                        return (
                          <Popover key={item.title}>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "flex items-center justify-center h-10 w-full rounded-md transition-colors",
                                  hasActiveChild
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <item.icon className="h-5 w-5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" align="start" className="w-56 p-2 z-50">
                              <div className="font-medium text-sm mb-2 px-2 text-muted-foreground">
                                {item.title}
                              </div>
                              <div className="space-y-1">
                                {item.children.map((child) => (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    className={cn(
                                      "flex items-center gap-2 py-2 px-2 rounded-md text-sm transition-colors",
                                      isActive(child.href)
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                  >
                                    <child.icon className="h-4 w-4" />
                                    {child.title}
                                  </Link>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      }

                      return (
                        <Collapsible
                          key={item.title}
                          open={isOpen}
                          onOpenChange={() => toggleItem(item.title)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              className={cn(
                                "flex items-center justify-between w-full h-10 px-3 rounded-md text-sm transition-colors",
                                hasActiveChild
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <span className="flex items-center gap-3">
                                <item.icon className="h-5 w-5" />
                                {item.title}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1 ml-4 pl-4 border-l">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={cn(
                                  "flex items-center gap-2 h-9 px-3 rounded-md text-sm transition-colors",
                                  isActive(child.href)
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <child.icon className="h-4 w-4" />
                                {child.title}
                              </Link>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    }

                    // Simple nav item
                    if (collapsed) {
                      return (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href!}
                              className={cn(
                                "flex items-center justify-center h-10 w-full rounded-md transition-colors",
                                isActive(item.href!)
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Link
                        key={item.title}
                        to={item.href!}
                        className={cn(
                          "flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors",
                          isActive(item.href!)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>
    </aside>
  );
}
