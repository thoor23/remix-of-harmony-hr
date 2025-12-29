import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WaveLoader } from "@/components/shared/LoadingSkeletons";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "hr" | "manager" | "employee")[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <WaveLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects: Record<string, string> = {
      admin: "/admin",
      hr: "/admin",
      manager: "/admin",
      employee: "/employee",
    };
    return <Navigate to={roleRedirects[role] || "/employee"} replace />;
  }

  return <>{children}</>;
}
