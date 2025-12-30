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
    label: "My Workspace",
    items: [
      { title: "My Dashboard", href: "/app", icon: LayoutDashboard },
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
          { title: "All Shifts", href: "/app/my-shifts/all", icon: Users },
          { title: "Exchange Requests", href: "/app/my-shifts/exchange", icon: ArrowLeftRight },
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
          { title: "My Report", href: "/app/my-payslips/report", icon: BarChart3 },
        ],
      },
      {
        title: "My Documents",
        icon: FileText,
        children: [
          { title: "Documents", href: "/app/my-documents", icon: FolderOpen },
        ],
      },
      {
        title: "My Assets",
        icon: Package,
        children: [
          { title: "Assigned Assets", href: "/app/my-assets", icon: Package },
          { title: "Maintenance Requests", href: "/app/my-assets/maintenance", icon: Wrench },
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
      { title: "My Settings", href: "/app/my-settings", icon: Settings },
    ],
  },
  {
    label: "Admin - Core Operations",
    items: [
      { title: "Admin Dashboard", href: "/app/admin", icon: LayoutDashboard },
      {
        title: "Employees",
        icon: Users,
        children: [
          { title: "Employee Directory", href: "/app/admin/employees", icon: Users2 },
          { title: "Add New Employee", href: "/app/admin/employees/new", icon: UserPlus },
          { title: "Profile Change Requests", href: "/app/admin/employees/change-requests", icon: ClipboardCheck },
        ],
      },
      {
        title: "Attendance",
        icon: Fingerprint,
        children: [
          { title: "Overview", href: "/app/admin/attendance", icon: ChartPie },
          { title: "Attendance Records", href: "/app/admin/attendance/all", icon: CalendarClock },
          { title: "Regularization Requests", href: "/app/admin/attendance/regularization", icon: ClipboardEdit },
          { title: "Attendance Policies", href: "/app/admin/attendance/policy", icon: Gavel },
        ],
      },
      {
        title: "Leaves",
        icon: CalendarOff,
        children: [
          { title: "Overview", href: "/app/admin/leaves", icon: PieChart },
          { title: "Leave Records", href: "/app/admin/leaves/all", icon: CalendarClock },
          { title: "Leave Applications", href: "/app/admin/leaves/requests", icon: ClipboardPen },
          { title: "Leave Policies", href: "/app/admin/leaves/policy", icon: Scale },
        ],
      },
      {
        title: "Shifts",
        icon: TimerReset,
        children: [
          { title: "Shift Schedule", href: "/app/admin/shifts", icon: ListChecks },
          { title: "Shift Assignments", href: "/app/admin/shifts/assignments", icon: UserCheck },
          { title: "Shift Rotations", href: "/app/admin/shifts/rotations", icon: Repeat },
          { title: "Shift Exchange", href: "/app/admin/shifts/exchange", icon: ArrowLeftRight },
          { title: "Shift Calendar", href: "/app/admin/shifts/calendar", icon: CalendarRange },
          { title: "Shift Policies", href: "/app/admin/shifts/policy", icon: Gavel },
        ],
      },
    ],
  },
  {
    label: "Admin - Financial",
    items: [
      {
        title: "Payroll",
        icon: Banknote,
        children: [
          { title: "Salary Configuration", href: "/app/admin/payroll/structure", icon: FileSpreadsheet },
          { title: "Payslip Records", href: "/app/admin/payroll/payslips", icon: Receipt },
        ],
      },
    ],
  },
  {
    label: "Admin - Resources",
    items: [
      {
        title: "Locations",
        icon: MapPin,
        children: [
          { title: "Store Directory", href: "/app/admin/locations/stores", icon: Store },
          { title: "Store Dashboard", href: "/app/admin/locations/stores/dashboard", icon: LayoutGrid },
          { title: "Office Directory", href: "/app/admin/locations/offices", icon: Building2 },
          { title: "Office Dashboard", href: "/app/admin/locations/offices/dashboard", icon: LayoutGrid },
          { title: "Employee Transfers", href: "/app/admin/locations/transfers", icon: ArrowLeftRight },
        ],
      },
      {
        title: "Assets",
        icon: Package,
        children: [
          { title: "Asset Inventory", href: "/app/admin/assets", icon: Package },
          { title: "Add New Asset", href: "/app/admin/assets/add", icon: PackagePlus },
          { title: "Asset Categories", href: "/app/admin/assets/categories", icon: Tags },
          { title: "Asset Assignments", href: "/app/admin/assets/assignments", icon: UserCheck },
          { title: "Asset Transfers", href: "/app/admin/assets/transfers", icon: ArrowLeftRight },
          { title: "Asset Maintenance", href: "/app/admin/assets/maintenance", icon: Wrench },
          { title: "Asset Reports", href: "/app/admin/assets/reports", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Admin - Documentation",
    items: [
      {
        title: "Documents",
        icon: FolderOpen,
        children: [
          { title: "Employee Files", href: "/app/admin/file-manager", icon: Folders },
          { title: "Document Policies", href: "/app/admin/file-manager/policies", icon: FileStack },
        ],
      },
      {
        title: "Letters",
        icon: FileSignature,
        children: [
          { title: "Offer Letter", href: "/app/admin/letters/offer", icon: FilePlus },
          { title: "Experience Letter", href: "/app/admin/letters/experience", icon: Award },
          { title: "Relieving Letter", href: "/app/admin/letters/relieving", icon: FileOutput },
          { title: "Increment Letter", href: "/app/admin/letters/increment", icon: TrendingUp },
        ],
      },
      {
        title: "Templates",
        icon: LayoutTemplate,
        children: [
          { title: "Payslip Templates", href: "/app/admin/payroll/templates", icon: Receipt },
          { title: "Letter Templates", href: "/app/admin/letters/templates", icon: FileText },
          { title: "Announcement Templates", href: "/app/admin/announcements/templates", icon: Megaphone },
          { title: "Banner Templates", href: "/app/admin/announcements/banner-templates", icon: Palette },
          { title: "Email Templates", href: "/app/admin/settings/email-templates", icon: Mail },
        ],
      },
    ],
  },
  {
    label: "Admin - Communication",
    items: [
      {
        title: "Helpdesk",
        icon: Headset,
        children: [
          { title: "All Tickets", href: "/app/admin/helpdesk", icon: Ticket },
        ],
      },
      {
        title: "Announcements",
        icon: BellRing,
        children: [
          { title: "All Announcements", href: "/app/admin/announcements", icon: Megaphone },
          { title: "Send Notifications", href: "/app/admin/notifications/send", icon: Send },
        ],
      },
    ],
  },
  {
    label: "Admin - Analytics",
    items: [
      {
        title: "Reports",
        icon: BarChart3,
        children: [
          { title: "Reports Overview", href: "/app/admin/reports", icon: ChartPie },
          { title: "Employee Reports", href: "/app/admin/reports/employee", icon: Users2 },
          { title: "Attendance Reports", href: "/app/admin/reports/attendance", icon: CalendarDays },
          { title: "Leave Reports", href: "/app/admin/reports/leave", icon: CalendarCheck },
          { title: "Payroll Reports", href: "/app/admin/reports/payroll", icon: PieChart },
        ],
      },
      {
        title: "Settings",
        icon: Building2,
        children: [
          { title: "Company Branding", href: "/app/admin/settings/company", icon: Building2 },
          { title: "Departments", href: "/app/admin/settings/departments", icon: Building },
          { title: "Designations", href: "/app/admin/settings/designations", icon: BadgeCheck },
          { title: "Roles & Permissions", href: "/app/admin/settings/roles", icon: Shield },
          { title: "Notification Settings", href: "/app/admin/settings/notifications", icon: Bell },
          { title: "Email Configuration", href: "/app/admin/settings/email", icon: Mail },
          { title: "System Preferences", href: "/app/admin/settings/system", icon: Settings2 },
          { title: "Data Management", href: "/app/admin/settings/seeder", icon: Database },
        ],
      },
      {
        title: "Audit Logs",
        icon: ScrollText,
        children: [
          { title: "All Logs", href: "/app/admin/audit-logs", icon: FileText },
          { title: "Employee Logs", href: "/app/admin/audit-logs/employee", icon: Users2 },
          { title: "Attendance Logs", href: "/app/admin/audit-logs/attendance", icon: Fingerprint },
          { title: "Leave Logs", href: "/app/admin/audit-logs/leave", icon: CalendarOff },
          { title: "Shift Logs", href: "/app/admin/audit-logs/shift", icon: TimerReset },
          { title: "Payroll Logs", href: "/app/admin/audit-logs/payroll", icon: Banknote },
          { title: "Asset Logs", href: "/app/admin/audit-logs/asset", icon: Package },
          { title: "Helpdesk Logs", href: "/app/admin/audit-logs/helpdesk", icon: Headset },
          { title: "Settings Logs", href: "/app/admin/audit-logs/settings", icon: Cog },
          { title: "Auth Logs", href: "/app/admin/audit-logs/auth", icon: Shield },
        ],
      },
    ],
  },
];

// Map navigation items to their corresponding RBAC modules
const navItemToModule: Record<string, string> = {
  // Employee modules
  "My Dashboard": "Employee Dashboard",
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
  "Admin Dashboard": "Admin Dashboard",
  "Employees": "Employees",
  "Attendance": "Attendance",
  "Leaves": "Leaves",
  "Shifts": "Shifts",
  "Payroll": "Payroll",
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
};

interface UnifiedSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function UnifiedSidebar({ collapsed, onCollapsedChange }: UnifiedSidebarProps) {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { data: branding } = useCompanyBranding();
  const { canRead, permissions, loading: permLoading } = usePermissions();

  // Filter navigation based on permissions
  const filteredNavSections = useMemo(() => {
    if (permLoading || permissions.length === 0) {
      return unifiedNavSections;
    }

    return unifiedNavSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const module = navItemToModule[item.title];
        if (!module) return true;
        return canRead(module);
      }).map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children
          };
        }
        return item;
      }).filter(item => !item.children || item.children.length > 0)
    })).filter(section => section.items.length > 0);
  }, [permissions, permLoading, canRead]);

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
