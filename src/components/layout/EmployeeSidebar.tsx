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
  User,
  Users,
  CalendarDays,
  CalendarCheck,
  Wallet,
  FileText,
  Calendar,
  HelpCircle,
  ArrowLeftRight,
  Settings,
  Package,
  ChevronDown,
  Clock,
  ClipboardEdit,
  FolderOpen,
  FileStack,
  Ticket,
  Receipt,
  TrendingUp,
  Plus,
  History,
  PieChart,
  Eye,
  MessageSquarePlus,
  UserCircle,
  BarChart3,
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

// Flat navigation items - no section groupings
const employeeNavItems: NavItem[] = [
  { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
  {
    title: "Attendance",
    icon: CalendarDays,
    children: [
      { title: "Attendance Records", href: "/employee/attendance", icon: Clock },
      { title: "Regularization Requests", href: "/employee/attendance/regularization", icon: ClipboardEdit },
      { title: "My Report", href: "/employee/attendance/report", icon: BarChart3 },
    ],
  },
  {
    title: "Shift Management",
    icon: Clock,
    children: [
      { title: "My Shift Schedule", href: "/employee/shifts", icon: Eye },
      { title: "All Shifts", href: "/employee/all-shifts", icon: Users },
      { title: "Exchange Requests", href: "/employee/shift-exchange", icon: ArrowLeftRight },
      { title: "My Report", href: "/employee/shifts/report", icon: BarChart3 },
    ],
  },
  { title: "Holiday Calendar", href: "/employee/holidays", icon: Calendar },
  {
    title: "Leave Requests",
    icon: CalendarCheck,
    children: [
      { title: "Apply Leave", href: "/employee/leaves/apply", icon: Plus },
      { title: "Leave Records", href: "/employee/leaves", icon: History },
      { title: "Leave Balance", href: "/employee/leaves/balance", icon: PieChart },
      { title: "My Report", href: "/employee/leaves/report", icon: BarChart3 },
    ],
  },
  {
    title: "Payroll",
    icon: Wallet,
    children: [
      { title: "Payslip Records", href: "/employee/payslips", icon: Receipt },
      { title: "Salary Configuration", href: "/employee/payslips/details", icon: TrendingUp },
      { title: "My Report", href: "/employee/payroll/report", icon: BarChart3 },
    ],
  },
  {
    title: "Documents",
    icon: FileText,
    children: [
      { title: "My Documents", href: "/employee/documents", icon: FolderOpen },
      { title: "Document Policies", href: "/employee/documents/policies", icon: FileStack },
      { title: "My Report", href: "/employee/documents/report", icon: BarChart3 },
    ],
  },
  {
    title: "Assets",
    icon: Package,
    children: [
      { title: "Assigned Assets", href: "/employee/assets", icon: Package },
      { title: "My Report", href: "/employee/assets/report", icon: BarChart3 },
    ],
  },
  {
    title: "Helpdesk",
    icon: HelpCircle,
    children: [
      { title: "New Ticket", href: "/employee/helpdesk/new", icon: MessageSquarePlus },
      { title: "All Tickets", href: "/employee/helpdesk", icon: Ticket },
      { title: "My Report", href: "/employee/helpdesk/report", icon: BarChart3 },
    ],
  },
  { title: "Profile", href: "/employee/profile", icon: UserCircle },
  { title: "Settings", href: "/employee/settings", icon: Settings },
];

interface EmployeeSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function EmployeeSidebar({ collapsed, onCollapsedChange }: EmployeeSidebarProps) {
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
            {branding?.companyName || "Employee Portal"}
          </span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <TooltipProvider delayDuration={0}>
          <nav className="px-2 space-y-1">
            {employeeNavItems.map((item) => {
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

              // Simple nav item without children
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
          </nav>
        </TooltipProvider>
      </ScrollArea>
    </aside>
  );
}
