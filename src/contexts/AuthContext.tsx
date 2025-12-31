import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, getAccessToken } from "@/lib/api";

type AppRole = "admin" | "hr" | "manager" | "employee";

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: { access_token: string } | null;
  role: AppRole | null;
  profile: Profile | null;
  employeeId: string | null;
  companyId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await authApi.getMe();
        setUser(data.user);
        setRole(data.user.role as AppRole);
        setProfile(data.profile);
        setEmployeeId(data.employee?.id || null);
        setCompanyId(data.user.companyId || null);
        setSession({ access_token: token });
      } catch (error) {
        // Token invalid, clear it
        authApi.clearTokens();
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setEmployeeId(null);
        setCompanyId(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      setRole(data.user.role as AppRole);
      setProfile(data.user.profile);
      setEmployeeId(data.user.employeeId || null);
      setCompanyId(data.user.companyId || null);
      setSession({ access_token: data.session.access_token });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      await authApi.register(email, password, firstName, lastName);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await authApi.logout();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setEmployeeId(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        employeeId,
        companyId,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
