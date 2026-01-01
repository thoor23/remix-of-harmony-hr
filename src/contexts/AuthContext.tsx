import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "hr" | "manager" | "employee";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: Profile | null;
  employeeId: string | null;
  companyId: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchCompany: (companyId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user profile, role, and employee data
  // Returns the fetched role for immediate use
  const fetchUserData = async (userId: string): Promise<AppRole | null> => {
    let fetchedRole: AppRole | null = null;
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        });
        setCompanyId(profileData.company_id);
      }

      // Fetch role - use maybeSingle to avoid errors
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      }

      if (roleData) {
        fetchedRole = roleData.role as AppRole;
        setRole(fetchedRole);
      }

      // Fetch employee
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id, company_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (employeeData) {
        setEmployeeId(employeeData.id);
        if (!companyId && employeeData.company_id) {
          setCompanyId(employeeData.company_id);
        }
      }

      // Check if super admin
      const { data: superAdminData } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      setIsSuperAdmin(!!superAdminData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    return fetchedRole;
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Keep loading true until fetchUserData completes
          setLoading(true);
          // Defer data fetch with setTimeout to avoid deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            await fetchUserData(session.user.id);
            if (isMounted) {
              setLoading(false);
            }
          }, 0);
        } else {
          // Clear all state on logout
          setRole(null);
          setProfile(null);
          setEmployeeId(null);
          setCompanyId(null);
          setIsSuperAdmin(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setEmployeeId(null);
    setCompanyId(null);
    setIsSuperAdmin(false);
  };

  const switchCompany = (newCompanyId: string) => {
    setCompanyId(newCompanyId);
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
        isSuperAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        switchCompany,
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
