import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  Menu,
  X,
  Home,
} from "lucide-react";
import { toast } from "sonner";

import { ClipboardList, BarChart3 } from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { label: "Companies", href: "/super-admin/companies", icon: Building2 },
  { label: "Super Admins", href: "/super-admin/users", icon: Shield },
  { label: "Audit Logs", href: "/super-admin/audit", icon: ClipboardList },
  { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
];

export function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split("@")[0] || "Super Admin";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href?: string }[] = [];
    let currentPath = "";

    const labels: Record<string, string> = {
      "super-admin": "Super Admin",
      dashboard: "Dashboard",
      companies: "Companies",
      users: "Super Admins",
      settings: "Global Settings",
      new: "Add New",
      edit: "Edit",
      audit: "Audit Logs",
      analytics: "Analytics",
      "add-admin": "Create Admin",
    };

    // UUID regex pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      if (segment === "super-admin") return;

      // Skip UUID segments - show "Details" instead
      if (uuidPattern.test(segment)) {
        if (index < pathSegments.length - 1) {
          breadcrumbs.push({ label: "Details", href: currentPath });
        } else {
          breadcrumbs.push({ label: "Details" });
        }
        return;
      }

      // Check if previous segment is "companies" - this is a company code
      const prevSegment = pathSegments[index - 1];
      if (prevSegment === "companies" && !labels[segment]) {
        // This is a company code, show it directly
        if (index < pathSegments.length - 1) {
          breadcrumbs.push({ label: segment.toUpperCase(), href: currentPath });
        } else {
          breadcrumbs.push({ label: segment.toUpperCase() });
        }
        return;
      }

      const label = labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      if (index < pathSegments.length - 1) {
        breadcrumbs.push({ label, href: currentPath });
      } else {
        breadcrumbs.push({ label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 md:relative md:translate-x-0 flex-shrink-0 overflow-hidden flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Super Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/app/dashboard">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar - Fixed */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-muted-foreground">
              <Link to="/super-admin/dashboard" className="hover:text-foreground">
                <Shield className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-2" />
                  {item.href ? (
                    <Link to={item.href} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {displayName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block font-medium">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/app/dashboard" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to App
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content - Scrollable */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
