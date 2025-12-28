import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, Loader2, ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<string, string>>;
type AuthView = "login" | "forgot-password" | "reset-password";

// Geometric shapes component for the left panel
const GeometricPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Grid overlay */}
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />
    
    {/* Top left diamond */}
    <div className="absolute top-16 left-16 w-6 h-6 bg-background rotate-45 opacity-90" />
    
    {/* Top right shapes */}
    <div className="absolute -top-10 right-20 w-32 h-32 rounded-full bg-amber-600/80" />
    <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-background/20" />
    <div className="absolute top-2 right-32 w-16 h-16 rounded-full bg-primary/50" />
    
    {/* Center left circle */}
    <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full border-[20px] border-primary/40" />
    
    {/* White dot top */}
    <div className="absolute top-20 right-1/3 w-4 h-4 rounded-full bg-background" />
    
    {/* Bottom left shapes */}
    <div className="absolute bottom-32 left-8 w-24 h-24 bg-amber-600/70" />
    <div className="absolute bottom-16 left-24 w-16 h-16 rounded-full bg-primary/40" />
    
    {/* Bottom center shapes */}
    <div className="absolute -bottom-20 left-1/4 w-40 h-40 rounded-full bg-primary/30" />
    <div className="absolute bottom-8 left-1/3 w-28 h-16 rounded-full bg-background/15" />
    
    {/* Bottom right shapes */}
    <div className="absolute bottom-24 right-16 w-20 h-20 rounded-full bg-background/10" />
    <div className="absolute bottom-8 right-8 w-5 h-5 bg-amber-600/80 rotate-45" />
    <div className="absolute bottom-16 right-32 w-32 h-32 rounded-full bg-background/10" />
    
    {/* Cream colored shapes */}
    <div className="absolute top-16 right-4 w-16 h-32 rounded-t-full bg-amber-50/30" />
    <div className="absolute bottom-0 left-0 w-24 h-20 rounded-tr-full bg-amber-50/20" />
    <div className="absolute bottom-0 right-24 w-16 h-12 rounded-t-full bg-amber-50/25" />
  </div>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const { data: branding } = useCompanyBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const companyName = branding?.companyName || "HRMS Portal";

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const hashParams = new URLSearchParams(location.hash.substring(1));
  const isPasswordReset = hashParams.get("type") === "recovery";

  if (isPasswordReset && view !== "reset-password") {
    setView("reset-password");
  }

  if (user && !isPasswordReset) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin";
    navigate(from, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email before logging in");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Welcome back!");
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin";
    navigate(from, { replace: true });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent! Check your inbox.");
    setView("login");
    setResetEmail("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = newPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword: confirmNewPassword,
    });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully!");
    window.location.href = "/auth";
  };

  const renderError = (field: string) => {
    if (errors[field]) {
      return <p className="text-sm text-destructive mt-1">{errors[field]}</p>;
    }
    return null;
  };

  // Forgot Password View
  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden flex min-h-[600px]">
          {/* Left Panel */}
          <div className="hidden md:flex md:w-1/2 bg-primary relative">
            <GeometricPattern />
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Reset Password
              </h2>
              <p className="text-primary-foreground/70 max-w-xs">
                We'll send you instructions to reset your password.
              </p>
              <div className="flex gap-2 mt-8">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
                <div className="w-6 h-2 rounded-full bg-primary-foreground" />
                <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col p-8 md:p-12">
            {/* Back to login - Top left */}
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-4 text-primary hover:text-primary/80 self-start"
              onClick={() => setView("login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-8">
                <Avatar className="h-9 w-9 rounded-lg">
                  <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                  <AvatarFallback className="rounded-lg bg-primary">
                    <Building2 className="h-5 w-5 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xl font-bold">{companyName}</span>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground text-sm">
                  Enter your email to receive reset instructions.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={`h-12 pl-11 pr-4 border-border ${errors.email ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  {renderError("email")}
                </div>

                <Button type="submit" className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password View
  if (view === "reset-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden flex min-h-[600px]">
          {/* Left Panel */}
          <div className="hidden md:flex md:w-1/2 bg-primary relative">
            <GeometricPattern />
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                New Password
              </h2>
              <p className="text-primary-foreground/70 max-w-xs">
                Create a strong password to secure your account.
              </p>
              <div className="flex gap-2 mt-8">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
                <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
                <div className="w-6 h-2 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Avatar className="h-9 w-9 rounded-lg">
                  <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                  <AvatarFallback className="rounded-lg bg-primary">
                    <Building2 className="h-5 w-5 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xl font-bold">{companyName}</span>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">Set New Password</h1>
                <p className="text-muted-foreground text-sm">
                  Must be at least 6 characters.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`h-12 px-4 pr-12 border-border ${errors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {renderError("password")}
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`h-12 px-4 border-border ${errors.confirmPassword ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  {renderError("confirmPassword")}
                </div>

                <Button type="submit" className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Login View
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden flex min-h-[600px]">
        {/* Left Panel - Geometric Design */}
        <div className="hidden md:flex md:w-1/2 bg-primary relative">
          <GeometricPattern />
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Welcome Back
            </h2>
            <p className="text-primary-foreground/70 max-w-xs">
              Manage your workforce efficiently with our comprehensive HR management solution.
            </p>
            {/* Carousel dots */}
            <div className="flex gap-2 mt-8">
              <div className="w-6 h-2 rounded-full bg-primary-foreground" />
              <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
              <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-lg bg-primary">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-bold">{companyName}</span>
            </div>

            {/* Welcome text */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold mb-2">
                Welcome to <span className="font-bold">{companyName}</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to continue to {companyName}.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className={`h-12 pl-11 pr-4 border-border ${errors.email ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                {renderError("email")}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={`h-12 pl-11 pr-12 border-border ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {renderError("password")}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setView("forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <span className="text-primary font-medium">Contact Admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
