import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  LayoutDashboard,
  User,
  CalendarDays,
  CalendarCheck,
  Wallet,
  FileText,
  Calendar,
  HelpCircle,
  ArrowLeftRight,
  Settings,
  Package,
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
  href: string;
  icon: React.ElementType;
}

const employeeNavItems: NavItem[] = [
  { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { title: "My Profile", href: "/employee/profile", icon: User },
  { title: "My Attendance", href: "/employee/attendance", icon: CalendarDays },
  { title: "My Leaves", href: "/employee/leaves", icon: CalendarCheck },
  { title: "Shift Exchange", href: "/employee/shift-exchange", icon: ArrowLeftRight },
  { title: "My Payslips", href: "/employee/payslips", icon: Wallet },
  { title: "My Documents", href: "/employee/documents", icon: FileText },
  { title: "My Assets", href: "/employee/assets", icon: Package },
  { title: "Holiday Calendar", href: "/employee/holidays", icon: Calendar },
  { title: "Helpdesk", href: "/employee/helpdesk", icon: HelpCircle },
  { title: "Settings", href: "/employee/settings", icon: Settings },
];

interface EmployeeSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function EmployeeSidebar({ collapsed, onCollapsedChange }: EmployeeSidebarProps) {
  const location = useLocation();
  const { data: branding } = useCompanyBranding();

  const isActive = (href: string) => location.pathname === href;

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
        <nav className="px-2 space-y-1">
          {employeeNavItems.map((item) => {
            if (collapsed) {
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "flex items-center justify-center h-10 w-full rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={item.title}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors",
                  isActive(item.href)
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
    </aside>
  );
}
