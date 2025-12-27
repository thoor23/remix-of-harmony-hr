import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  CalendarDays,
  CalendarCheck,
  Wallet,
  FileText,
  Megaphone,
  Settings,
  ClipboardList,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  List,
  UserCog,
  RefreshCw,
  ArrowLeftRight,
  Calendar,
  Banknote,
  Receipt,
  PieChart,
  Building,
  BadgeCheck,
  Shield,
  Settings2,
  Bell,
  Palette,
} from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: { title: string; href: string; icon: React.ElementType }[];
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    title: "Employees",
    icon: Users,
    children: [
      { title: "All Employees", href: "/admin/employees", icon: Users2 },
      { title: "Add Employee", href: "/admin/employees/new", icon: UserPlus },
    ],
  },
  {
    title: "Attendance",
    icon: CalendarDays,
    children: [
      { title: "Overview", href: "/admin/attendance", icon: Eye },
      { title: "Policy & Rules", href: "/admin/attendance/policy", icon: BookOpen },
    ],
  },
  {
    title: "Leave Management",
    icon: CalendarCheck,
    children: [
      { title: "Leave Requests", href: "/admin/leaves", icon: FileCheck },
      { title: "Policy & Rules", href: "/admin/leaves/policy", icon: BookOpen },
    ],
  },
  {
    title: "Shift Management",
    icon: Clock,
    children: [
      { title: "All Shifts", href: "/admin/shifts", icon: List },
      { title: "Assignments", href: "/admin/shifts/assignments", icon: UserCog },
      { title: "Rotations", href: "/admin/shifts/rotations", icon: RefreshCw },
      { title: "Exchange Requests", href: "/admin/shifts/exchange", icon: ArrowLeftRight },
      { title: "Calendar", href: "/admin/shifts/calendar", icon: Calendar },
      { title: "Policy & Rules", href: "/admin/shifts/policy", icon: BookOpen },
    ],
  },
  {
    title: "Payroll",
    icon: Wallet,
    children: [
      { title: "Salary Structure", href: "/admin/payroll/structure", icon: Banknote },
      { title: "Payslips", href: "/admin/payroll/payslips", icon: Receipt },
    ],
  },
  { title: "Documents", href: "/admin/documents", icon: FileText },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      { title: "Overview", href: "/admin/reports", icon: Eye },
      { title: "Employee", href: "/admin/reports/employee", icon: Users2 },
      { title: "Attendance", href: "/admin/reports/attendance", icon: CalendarDays },
      { title: "Leave", href: "/admin/reports/leave", icon: CalendarCheck },
      { title: "Payroll", href: "/admin/reports/payroll", icon: PieChart },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "Departments", href: "/admin/settings/departments", icon: Building },
      { title: "Designations", href: "/admin/settings/designations", icon: BadgeCheck },
      { title: "Roles", href: "/admin/settings/roles", icon: Shield },
      { title: "Company", href: "/admin/settings/company", icon: Building2 },
      { title: "Notifications", href: "/admin/settings/notifications", icon: Bell },
      { title: "System", href: "/admin/settings/system", icon: Settings2 },
      { title: "Appearance", href: "/admin/settings/appearance", icon: Palette },
    ],
  },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapsedChange }: AdminSidebarProps) {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<string[]>(["Employees", "Leave Management"]);

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
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg">HRMS Admin</span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <TooltipProvider delayDuration={0}>
          <nav className="px-2 space-y-1">
            {adminNavItems.map((item) => {
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
          </nav>
        </TooltipProvider>
      </ScrollArea>

    </aside>
  );
}
