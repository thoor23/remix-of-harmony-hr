import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const adminNavSections: NavSection[] = [
  {
    label: "Core Operations",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
      {
        title: "Employee Management",
        icon: Users,
        children: [
          { title: "Employee Directory", href: "/admin/employees", icon: Users2 },
          { title: "Add New Employee", href: "/admin/employees/new", icon: UserPlus },
          { title: "Profile Change Requests", href: "/admin/employees/change-requests", icon: ClipboardCheck },
        ],
      },
      {
        title: "Attendance Management",
        icon: Fingerprint,
        children: [
          { title: "Overview", href: "/admin/attendance", icon: ChartPie },
          { title: "Attendance Records", href: "/admin/attendance/all", icon: CalendarClock },
          { title: "Regularization Requests", href: "/admin/attendance/regularization", icon: ClipboardEdit },
          { title: "Attendance Policies", href: "/admin/attendance/policy", icon: Gavel },
        ],
      },
      {
        title: "Leave Management",
        icon: CalendarOff,
        children: [
          { title: "Overview", href: "/admin/leaves", icon: PieChart },
          { title: "Leave Records", href: "/admin/leaves/all", icon: CalendarClock },
          { title: "Leave Applications", href: "/admin/leaves/requests", icon: ClipboardPen },
          { title: "Leave Policies", href: "/admin/leaves/policy", icon: Scale },
        ],
      },
      {
        title: "Shift Management",
        icon: TimerReset,
        children: [
          { title: "Shift Schedule", href: "/admin/shifts", icon: ListChecks },
          { title: "Shift Assignments", href: "/admin/shifts/assignments", icon: UserCheck },
          { title: "Shift Rotations", href: "/admin/shifts/rotations", icon: Repeat },
          { title: "Shift Exchange", href: "/admin/shifts/exchange", icon: ArrowLeftRight },
          { title: "Shift Calendar", href: "/admin/shifts/calendar", icon: CalendarRange },
          { title: "Shift Policies", href: "/admin/shifts/policy", icon: Gavel },
        ],
      },
    ],
  },
  {
    label: "Financial",
    items: [
      {
        title: "Payroll Management",
        icon: Banknote,
        children: [
          { title: "Salary Configuration", href: "/admin/payroll/structure", icon: FileSpreadsheet },
          { title: "Payslip Records", href: "/admin/payroll/payslips", icon: Receipt },
        ],
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        title: "Location Management",
        icon: MapPin,
        children: [
          { title: "Store Directory", href: "/admin/locations/stores", icon: Store },
          { title: "Store Dashboard", href: "/admin/locations/stores/dashboard", icon: LayoutGrid },
          { title: "Office Directory", href: "/admin/locations/offices", icon: Building2 },
          { title: "Office Dashboard", href: "/admin/locations/offices/dashboard", icon: LayoutGrid },
          { title: "Employee Transfers", href: "/admin/locations/transfers", icon: ArrowLeftRight },
        ],
      },
      {
        title: "Asset Management",
        icon: Package,
        children: [
          { title: "Asset Inventory", href: "/admin/assets", icon: Package },
          { title: "Add New Asset", href: "/admin/assets/add", icon: PackagePlus },
          { title: "Asset Categories", href: "/admin/assets/categories", icon: Tags },
          { title: "Asset Assignments", href: "/admin/assets/assignments", icon: UserCheck },
          { title: "Asset Transfers", href: "/admin/assets/transfers", icon: ArrowLeftRight },
          { title: "Asset Maintenance", href: "/admin/assets/maintenance", icon: Wrench },
          { title: "Asset Reports", href: "/admin/assets/reports", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Documentation",
    items: [
      {
        title: "Document Management",
        icon: FolderOpen,
        children: [
          { title: "Employee Files", href: "/admin/file-manager", icon: Folders },
          { title: "Document Policies", href: "/admin/file-manager/policies", icon: FileStack },
        ],
      },
      {
        title: "Letter Generation",
        icon: FileSignature,
        children: [
          { title: "Offer Letter", href: "/admin/letters/offer", icon: FilePlus },
          { title: "Experience Letter", href: "/admin/letters/experience", icon: Award },
          { title: "Relieving Letter", href: "/admin/letters/relieving", icon: FileOutput },
          { title: "Increment Letter", href: "/admin/letters/increment", icon: TrendingUp },
        ],
      },
      {
        title: "Template Management",
        icon: LayoutTemplate,
        children: [
          { title: "Payslip Templates", href: "/admin/payroll/templates", icon: Receipt },
          { title: "Letter Templates", href: "/admin/letters/templates", icon: FileText },
          { title: "Announcement Templates", href: "/admin/announcements/templates", icon: Megaphone },
          { title: "Banner Templates", href: "/admin/announcements/banner-templates", icon: Palette },
          { title: "Email Templates", href: "/admin/settings/email-templates", icon: Mail },
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
          { title: "All Tickets", href: "/admin/helpdesk", icon: Ticket },
        ],
      },
      {
        title: "Announcement Centre",
        icon: BellRing,
        children: [
          { title: "Notification Centre", href: "/admin/notification-centre", icon: Bell },
        ],
      },
    ],
  },
  {
    label: "Analytics & Admin",
    items: [
      {
        title: "Reports & Analytics",
        icon: BarChart3,
        children: [
          { title: "Reports Overview", href: "/admin/reports", icon: ChartPie },
          { title: "Employee Reports", href: "/admin/reports/employee", icon: Users2 },
          { title: "Attendance Reports", href: "/admin/reports/attendance", icon: CalendarDays },
          { title: "Leave Reports", href: "/admin/reports/leave", icon: CalendarCheck },
          { title: "Payroll Reports", href: "/admin/reports/payroll", icon: PieChart },
        ],
      },
      {
        title: "Company Settings",
        icon: Building2,
        children: [
          { title: "Company Branding", href: "/admin/settings/company", icon: Building2 },
          { title: "Departments", href: "/admin/settings/departments", icon: Building },
          { title: "Designations", href: "/admin/settings/designations", icon: BadgeCheck },
          { title: "Roles & Permissions", href: "/admin/settings/roles", icon: Shield },
          { title: "Notification Settings", href: "/admin/settings/notifications", icon: Bell },
          { title: "Email Configuration", href: "/admin/settings/email", icon: Mail },
          { title: "Email Templates", href: "/admin/settings/email-templates", icon: LayoutTemplate },
          { title: "System Preferences", href: "/admin/settings/system", icon: Settings2 },
          { title: "Data Management", href: "/admin/settings/seeder", icon: Database },
        ],
      },
      {
        title: "Audit Logs",
        icon: ScrollText,
        children: [
          { title: "All Logs", href: "/admin/audit-logs", icon: FileText },
          { title: "Employee Logs", href: "/admin/audit-logs/employee", icon: Users2 },
          { title: "Attendance Logs", href: "/admin/audit-logs/attendance", icon: Fingerprint },
          { title: "Leave Logs", href: "/admin/audit-logs/leave", icon: CalendarOff },
          { title: "Shift Logs", href: "/admin/audit-logs/shift", icon: TimerReset },
          { title: "Payroll Logs", href: "/admin/audit-logs/payroll", icon: Banknote },
          { title: "Asset Logs", href: "/admin/audit-logs/asset", icon: Package },
          { title: "Helpdesk Logs", href: "/admin/audit-logs/helpdesk", icon: Headset },
          { title: "Documents Logs", href: "/admin/audit-logs/documents", icon: FolderOpen },
          { title: "Letters Logs", href: "/admin/audit-logs/letters", icon: FileSignature },
          { title: "Announcements Logs", href: "/admin/audit-logs/announcements", icon: BellRing },
          { title: "Templates Logs", href: "/admin/audit-logs/templates", icon: LayoutTemplate },
          { title: "Departments Logs", href: "/admin/audit-logs/departments", icon: Building },
          { title: "Designations Logs", href: "/admin/audit-logs/designations", icon: BadgeCheck },
          { title: "Settings Logs", href: "/admin/audit-logs/settings", icon: Cog },
          { title: "Auth Logs", href: "/admin/audit-logs/auth", icon: Shield },
        ],
      },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapsedChange }: AdminSidebarProps) {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { data: branding } = useCompanyBranding();

  // Close all open items when sidebar is collapsed
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
    children?.some((child) => location.pathname === child.href);

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
            {branding?.companyName || "HRMS Admin"}
          </span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <TooltipProvider delayDuration={0}>
          <nav className="px-2">
            {adminNavSections.map((section, sectionIndex) => (
              <div key={section.label} className={cn(sectionIndex > 0 && "mt-4")}>
                {/* Section Label */}
                {!collapsed && (
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </span>
                  </div>
                )}
                {collapsed && sectionIndex > 0 && (
                  <div className="mx-2 my-2 border-t border-sidebar-border" />
                )}
                
                {/* Section Items */}
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
                            <PopoverContent side="right" align="start" className="w-48 p-2">
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
                                  "flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors",
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
                            <p>{item.title}</p>
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
