import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Menu,
  Settings,
  User,
  LogOut,
  Home,
  ChevronRight,
  ChevronLeft,
  Palette,
} from "lucide-react";
import { adminUser, currentUser } from "@/data/mockData";

interface TopBarProps {
  isAdmin?: boolean;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

// Route label mappings
const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  employee: "Dashboard",
  employees: "Employees",
  shifts: "Shifts",
  leaves: "Leaves",
  payroll: "Payroll",
  attendance: "Attendance",
  documents: "Documents",
  announcements: "Announcements",
  settings: "Settings",
  reports: "Reports",
  audit: "Audit Logs",
  exchange: "Exchange Requests",
  list: "Shift List",
  rotations: "Rotations",
  calendar: "Calendar",
  assignments: "Assignments",
  structure: "Salary Structure",
  payslips: "Payslips",
  policy: "Leave Policy",
  add: "Add Employee",
  profile: "Profile",
  helpdesk: "Helpdesk",
  holidays: "Holidays",
  departments: "Departments",
  designations: "Designations",
  roles: "Roles",
  company: "Company",
  notifications: "Notifications",
  system: "System",
  appearance: "Appearance",
};

export function TopBar({ isAdmin = false, onMenuClick, sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const location = useLocation();
  const user = isAdmin ? adminUser : currentUser;

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href?: string }[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Don't add href to the last item (current page)
      if (index < pathSegments.length - 1) {
        breadcrumbs.push({ label, href: currentPath });
      } else {
        breadcrumbs.push({ label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const basePath = isAdmin ? "/admin" : "/employee";

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      {/* Left side - Collapse button and Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar collapse button */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex flex-shrink-0"
            onClick={onToggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
        
        <nav className="flex items-center text-sm text-muted-foreground overflow-hidden">
          <Link
            to={basePath}
            className="flex items-center hover:text-foreground transition-colors flex-shrink-0"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center min-w-0">
              <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium truncate">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium">New leave request</span>
              <span className="text-sm text-muted-foreground">
                Michael Chen requested 3 days casual leave
              </span>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium">Payslips generated</span>
              <span className="text-sm text-muted-foreground">
                December 2024 payslips are ready
              </span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium">New announcement</span>
              <span className="text-sm text-muted-foreground">
                Q1 2025 Town Hall Meeting scheduled
              </span>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-primary cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover p-2">
            {/* User info header */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem asChild className="cursor-pointer py-2.5 px-3 rounded-md">
              <Link to={isAdmin ? "/admin/profile" : "/employee/profile"} className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="cursor-pointer py-2.5 px-3 rounded-md">
              <Link to={isAdmin ? "/admin/settings/appearance" : "/employee/settings"} className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span>Appearance</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="cursor-pointer py-2.5 px-3 rounded-md">
              <Link to={isAdmin ? "/admin/settings/departments" : "/employee/settings"} className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem asChild className="cursor-pointer py-2.5 px-3 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10">
              <Link to="/" className="flex items-center gap-3">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}