import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, Loader2, ArrowLeft, Shield, Users, Clock, BarChart3 } from "lucide-react";
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

  // Check if this is a password reset callback
  const hashParams = new URLSearchParams(location.hash.substring(1));
  const isPasswordReset = hashParams.get("type") === "recovery";

  // Show reset password form if it's a recovery callback
  if (isPasswordReset && view !== "reset-password") {
    setView("reset-password");
  }

  // Redirect if already logged in (but not during password reset)
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

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Complete employee lifecycle management"
    },
    {
      icon: Clock,
      title: "Attendance Tracking",
      description: "Real-time attendance and time management"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive HR analytics and insights"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security for your data"
    }
  ];

  // Forgot Password View
  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <Avatar className="h-12 w-12 rounded-xl border-2 border-primary-foreground/20">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary-foreground/10">
                  <Building2 className="h-7 w-7 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">{companyName}</h1>
                <p className="text-sm text-primary-foreground/70">Human Resource Management</p>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
                Reset Your<br />Password
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-md">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-semibold">{companyName}</span>
            </div>

            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 mb-2"
                  onClick={() => setView("login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
                <h2 className="text-2xl font-semibold tracking-tight">Forgot password?</h2>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@company.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {renderError("email")}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
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
        <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <Avatar className="h-12 w-12 rounded-xl border-2 border-primary-foreground/20">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary-foreground/10">
                  <Building2 className="h-7 w-7 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">{companyName}</h1>
                <p className="text-sm text-primary-foreground/70">Human Resource Management</p>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
                Create New<br />Password
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-md">
                Choose a strong password to secure your account.
              </p>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-primary">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-semibold">{companyName}</span>
            </div>

            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <h2 className="text-2xl font-semibold tracking-tight">Set new password</h2>
                <CardDescription>
                  Enter your new password below.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={errors.password ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {renderError("password")}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    {renderError("confirmPassword")}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main Login View - Premium 2 Column Layout
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <Avatar className="h-12 w-12 rounded-xl border-2 border-primary-foreground/20">
              <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
              <AvatarFallback className="rounded-xl bg-primary-foreground/10">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">{companyName}</h1>
              <p className="text-sm text-primary-foreground/70">Human Resource Management</p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
              Welcome to your<br />HR Management<br />Platform
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Streamline your workforce management with our comprehensive HRMS solution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12">
            {features.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-medium text-primary-foreground">{feature.title}</h3>
                <p className="text-sm text-primary-foreground/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
              <AvatarFallback className="rounded-xl bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-semibold">{companyName}</span>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {renderError("email")}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0 h-auto font-normal text-muted-foreground hover:text-primary"
                      onClick={() => setView("forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className={errors.password ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {renderError("password")}
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Contact your administrator if you need an account
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
