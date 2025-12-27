import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarCheck,
  Wallet,
  FileText,
  Megaphone,
  Settings,
  ClipboardList,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
} from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    title: "Employees",
    icon: Users,
    children: [
      { title: "All Employees", href: "/admin/employees" },
      { title: "Add Employee", href: "/admin/employees/new" },
    ],
  },
  {
    title: "Attendance",
    icon: CalendarDays,
    children: [
      { title: "Overview", href: "/admin/attendance" },
      { title: "Regularization", href: "/admin/attendance/regularization" },
    ],
  },
  {
    title: "Leave Management",
    icon: CalendarCheck,
    children: [
      { title: "Leave Requests", href: "/admin/leaves" },
      { title: "Leave Policy", href: "/admin/leaves/policy" },
    ],
  },
  {
    title: "Shift Management",
    icon: Clock,
    children: [
      { title: "All Shifts", href: "/admin/shifts" },
      { title: "Assignments", href: "/admin/shifts/assignments" },
      { title: "Rotations", href: "/admin/shifts/rotations" },
      { title: "Exchange Requests", href: "/admin/shifts/exchange" },
      { title: "Calendar", href: "/admin/shifts/calendar" },
    ],
  },
  {
    title: "Payroll",
    icon: Wallet,
    children: [
      { title: "Salary Structure", href: "/admin/payroll/structure" },
      { title: "Payslips", href: "/admin/payroll/payslips" },
    ],
  },
  { title: "Documents", href: "/admin/documents", icon: FileText },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      { title: "Overview", href: "/admin/reports" },
      { title: "Employee", href: "/admin/reports/employee" },
      { title: "Attendance", href: "/admin/reports/attendance" },
      { title: "Leave", href: "/admin/reports/leave" },
      { title: "Payroll", href: "/admin/reports/payroll" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "Departments", href: "/admin/settings/departments" },
      { title: "Designations", href: "/admin/settings/designations" },
      { title: "Roles", href: "/admin/settings/roles" },
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
        <nav className="px-2 space-y-1">
          {adminNavItems.map((item) => {
            if (item.children) {
              const isOpen = openItems.includes(item.title);
              const hasActiveChild = isChildActive(item.children);

              if (collapsed) {
                return (
                  <Link
                    key={item.title}
                    to={item.children[0].href}
                    className={cn(
                      "flex items-center justify-center h-10 w-full rounded-md transition-colors",
                      hasActiveChild
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
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
                          "block py-2 px-3 rounded-md text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            if (collapsed) {
              return (
                <Link
                  key={item.title}
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
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              Collapse
            </>
          )}
        </Button>
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-sidebar-foreground mt-1",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </Link>
      </div>
    </aside>
  );
}
