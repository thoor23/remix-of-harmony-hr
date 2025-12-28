import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, Loader2, ArrowLeft, Lock, Mail } from "lucide-react";
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

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const { data: branding } = useCompanyBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [view, setView] = useState<AuthView>("login");
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
      return <p className="text-sm text-destructive mt-1.5">{errors[field]}</p>;
    }
    return null;
  };

  // Forgot Password View
  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex">
        {/* Left - Visual Panel */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl border border-primary-foreground/20">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary-foreground/10">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-semibold text-primary-foreground">{companyName}</span>
            </div>
            <div className="space-y-6 max-w-lg">
              <h1 className="text-5xl font-bold text-primary-foreground leading-tight">
                Reset Your Password
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>
            <p className="text-sm text-primary-foreground/50">
              © {new Date().getFullYear()} {companyName}
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold">{companyName}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-6 text-muted-foreground"
              onClick={() => setView("login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Forgot password?</h2>
              <p className="text-muted-foreground">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {renderError("email")}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
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
    );
  }

  // Reset Password View
  if (view === "reset-password") {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl border border-primary-foreground/20">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary-foreground/10">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-semibold text-primary-foreground">{companyName}</span>
            </div>
            <div className="space-y-6 max-w-lg">
              <h1 className="text-5xl font-bold text-primary-foreground leading-tight">
                Create New Password
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Choose a strong password to secure your account.
              </p>
            </div>
            <p className="text-sm text-primary-foreground/50">
              © {new Date().getFullYear()} {companyName}
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold">{companyName}</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Set new password</h2>
              <p className="text-muted-foreground">
                Must be at least 6 characters.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`pl-10 h-11 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {renderError("password")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`pl-10 h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {renderError("confirmPassword")}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
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
    );
  }

  // Main Login View
  return (
    <div className="min-h-screen flex">
      {/* Left - Visual Panel with gradient and decorative elements */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        
        {/* Decorative blurred circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 rounded-xl border border-primary-foreground/20 shadow-lg">
              <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
              <AvatarFallback className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-semibold text-primary-foreground">{companyName}</span>
          </div>

          {/* Main headline */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-bold text-primary-foreground leading-tight">
              Manage Your Workforce with Confidence
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Streamline HR operations, empower your team, and drive business success with our comprehensive platform.
            </p>
            
            {/* Stats */}
            <div className="flex gap-8 pt-6">
              <div>
                <div className="text-3xl font-bold text-primary-foreground">99.9%</div>
                <div className="text-sm text-primary-foreground/60">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-foreground">24/7</div>
                <div className="text-sm text-primary-foreground/60">Support</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-foreground">256-bit</div>
                <div className="text-sm text-primary-foreground/60">Encryption</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
              <AvatarFallback className="rounded-xl bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">{companyName}</span>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {renderError("email")}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setView("forgot-password")}
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={`pl-10 h-11 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
              </div>
              {renderError("password")}
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need an account?{" "}
            <span className="text-foreground">Contact your administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
}
