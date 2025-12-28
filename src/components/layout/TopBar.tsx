import { Link, useLocation, useNavigate } from "react-router-dom";
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
import {
  Menu,
  Settings,
  User,
  LogOut,
  Home,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Palette,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { AttendanceWidget } from "@/components/attendance/AttendanceWidget";

interface TopBarProps {
  isAdmin?: boolean;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

// Route label mappings
const routeLabels: Record<string, string> = {
  // Main sections
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
  
  // File Manager
  "file-manager": "File Manager",
  "employee-documents": "Employee Documents",
  "document-policies": "Document Policies",
  
  // Letters
  letters: "Letters",
  templates: "Templates",
  offer: "Offer Letter",
  experience: "Experience Letter",
  relieving: "Relieving Letter",
  increment: "Increment Letter",
  
  // Shifts
  exchange: "Exchange Requests",
  "shift-exchange": "Shift Exchange",
  list: "Shift List",
  rotations: "Rotations",
  calendar: "Calendar",
  assignments: "Assignments",
  
  // Payroll
  structure: "Salary Structure",
  payslips: "Payslips",
  
  // Leaves
  policy: "Leave Policy",
  
  // Employees
  add: "Add Employee",
  new: "Add New",
  edit: "Edit",
  
  // Settings
  departments: "Departments",
  designations: "Designations",
  roles: "Roles",
  company: "Company",
  notifications: "Notifications",
  system: "System",
  appearance: "Appearance",
  
  // Other
  profile: "Profile",
  helpdesk: "Helpdesk",
  holidays: "Holidays",
  "audit-logs": "Audit Logs",
  audit: "Audit",
  
  // Reports
  overview: "Overview",
};

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Get contextual label for UUID based on parent path
const getUUIDLabel = (parentSegments: string[]): string => {
  const parentPath = parentSegments.join("/");
  if (parentPath.includes("file-manager")) return "Employee Documents";
  if (parentPath.includes("employees") && parentPath.includes("edit")) return "Edit Employee";
  if (parentPath.includes("employees")) return "Employee Details";
  return "Details";
};

export function TopBar({ isAdmin = false, onMenuClick, sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, profile, signOut } = useAuth();

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split("@")[0] || "User";

  const displayEmail = user?.email || "";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href?: string }[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label: string;
      
      // Check if segment is a UUID
      if (UUID_PATTERN.test(segment)) {
        label = getUUIDLabel(pathSegments.slice(0, index));
      } else {
        label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      }
      
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
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Clock In/Out for all users */}
        <AttendanceWidget />
        
        {/* Notifications */}
        <NotificationsDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role || "employee"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover p-2">
            {/* User info header */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {displayName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
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
            
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="cursor-pointer py-2.5 px-3 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
