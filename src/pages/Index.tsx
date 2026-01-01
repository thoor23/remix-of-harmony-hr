import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  Calendar, 
  Wallet, 
  FileText, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Building2,
  UserCircle,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const Index = () => {
  const { user, role } = useAuth();
  const { data: branding } = useCompanyBranding();
  
  const companyName = branding?.companyName || "HRMS";

  const getDashboardLink = () => {
    if (!user) return "/auth";
    if (role === "admin" || role === "hr" || role === "manager") {
      return "/app/dashboard";
    }
    return "/app/my-dashboard";
  };

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Centralized employee database with complete profile management and organizational hierarchy."
    },
    {
      icon: Clock,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with clock-in/out, leave tracking, and overtime management."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Streamlined leave requests, approvals, and balance tracking with policy automation."
    },
    {
      icon: Wallet,
      title: "Payroll Processing",
      description: "Automated salary calculations, deductions, and payslip generation with compliance."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Secure document storage, letter generation, and digital signature workflows."
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Comprehensive dashboards and exportable reports for data-driven decisions."
    }
  ];

  const stats = [
    { value: "1000+", label: "Employees Managed", icon: Users },
    { value: "500+", label: "Companies Trust Us", icon: Building2 },
    { value: "99.9%", label: "System Uptime", icon: Zap },
    { value: "24/7", label: "Support Available", icon: Shield }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description: "Create your account in minutes with a simple registration process."
    },
    {
      number: "02",
      title: "Configure",
      description: "Set up departments, roles, policies, and import your employee data."
    },
    {
      number: "03",
      title: "Manage",
      description: "Start managing your workforce with powerful tools and insights."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
              <AvatarFallback className="rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold text-foreground">{companyName}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#portals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Portals
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link to={getDashboardLink()}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        {/* Dot Pattern */}
        <svg className="absolute top-0 right-0 w-64 h-64 text-muted-foreground/10" viewBox="0 0 100 100">
          {[...Array(10)].map((_, i) => 
            [...Array(10)].map((_, j) => (
              <circle key={`${i}-${j}`} cx={i * 10 + 5} cy={j * 10 + 5} r="1.5" fill="currentColor" />
            ))
          )}
        </svg>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Modern HR Management Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Streamline Your{" "}
                <span className="text-primary">HR Operations</span>{" "}
                With Ease
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                A comprehensive human resource management system that simplifies employee management, 
                attendance tracking, payroll processing, and more - all in one powerful platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="shadow-lg">
                  <Link to={user ? getDashboardLink() : "/auth"}>
                    {user ? "Go to Dashboard" : "Start Free Trial"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative bg-card rounded-2xl border shadow-2xl p-6">
                {/* Dashboard Mockup SVG */}
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Background */}
                  <rect x="0" y="0" width="400" height="300" rx="8" className="fill-muted" />
                  
                  {/* Sidebar */}
                  <rect x="0" y="0" width="80" height="300" rx="8" className="fill-card" />
                  <circle cx="40" cy="30" r="15" className="fill-primary/20" />
                  <rect x="20" y="60" width="40" height="8" rx="4" className="fill-muted" />
                  <rect x="20" y="80" width="40" height="8" rx="4" className="fill-muted" />
                  <rect x="20" y="100" width="40" height="8" rx="4" className="fill-primary/30" />
                  <rect x="20" y="120" width="40" height="8" rx="4" className="fill-muted" />
                  <rect x="20" y="140" width="40" height="8" rx="4" className="fill-muted" />
                  
                  {/* Main Content Area */}
                  {/* Stats Cards */}
                  <rect x="100" y="20" width="85" height="60" rx="6" className="fill-card" />
                  <rect x="195" y="20" width="85" height="60" rx="6" className="fill-card" />
                  <rect x="290" y="20" width="85" height="60" rx="6" className="fill-card" />
                  
                  {/* Card Icons */}
                  <circle cx="125" cy="45" r="12" className="fill-primary/20" />
                  <circle cx="220" cy="45" r="12" className="fill-primary/20" />
                  <circle cx="315" cy="45" r="12" className="fill-primary/20" />
                  
                  {/* Card Text Lines */}
                  <rect x="145" y="35" width="30" height="6" rx="3" className="fill-foreground/20" />
                  <rect x="145" y="48" width="20" height="4" rx="2" className="fill-muted-foreground/30" />
                  <rect x="240" y="35" width="30" height="6" rx="3" className="fill-foreground/20" />
                  <rect x="240" y="48" width="20" height="4" rx="2" className="fill-muted-foreground/30" />
                  <rect x="335" y="35" width="30" height="6" rx="3" className="fill-foreground/20" />
                  <rect x="335" y="48" width="20" height="4" rx="2" className="fill-muted-foreground/30" />
                  
                  {/* Chart Area */}
                  <rect x="100" y="100" width="180" height="120" rx="6" className="fill-card" />
                  <text x="115" y="125" className="fill-foreground/60 text-[10px]">Analytics</text>
                  
                  {/* Bar Chart */}
                  <rect x="120" y="180" width="20" height="25" rx="2" className="fill-primary/60" />
                  <rect x="150" y="160" width="20" height="45" rx="2" className="fill-primary/80" />
                  <rect x="180" y="145" width="20" height="60" rx="2" className="fill-primary" />
                  <rect x="210" y="170" width="20" height="35" rx="2" className="fill-primary/70" />
                  <rect x="240" y="155" width="20" height="50" rx="2" className="fill-primary/90" />
                  
                  {/* Table Area */}
                  <rect x="100" y="235" width="180" height="50" rx="6" className="fill-card" />
                  <rect x="115" y="250" width="150" height="6" rx="3" className="fill-muted" />
                  <rect x="115" y="265" width="120" height="6" rx="3" className="fill-muted" />
                  
                  {/* Right Panel */}
                  <rect x="295" y="100" width="80" height="185" rx="6" className="fill-card" />
                  <circle cx="335" cy="135" r="20" className="fill-primary/10" />
                  <circle cx="335" cy="135" r="15" className="fill-primary/20" />
                  <rect x="305" y="170" width="60" height="6" rx="3" className="fill-foreground/20" />
                  <rect x="315" y="185" width="40" height="4" rx="2" className="fill-muted-foreground/30" />
                  
                  {/* Activity Items */}
                  <circle cx="315" cy="220" r="4" className="fill-primary/40" />
                  <rect x="325" y="217" width="40" height="6" rx="3" className="fill-muted" />
                  <circle cx="315" cy="240" r="4" className="fill-primary/40" />
                  <rect x="325" y="237" width="40" height="6" rx="3" className="fill-muted" />
                  <circle cx="315" cy="260" r="4" className="fill-primary/40" />
                  <rect x="325" y="257" width="40" height="6" rx="3" className="fill-muted" />
                </svg>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                  Live Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage HR
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to streamline your human resource operations 
              and boost organizational efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Two Powerful Portals
            </h2>
            <p className="text-lg text-muted-foreground">
              Dedicated interfaces for administrators and employees, each optimized for their specific needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Admin Portal */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/5 p-8 border-b">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Admin / HR Portal</h3>
                  <p className="text-muted-foreground">
                    Complete control over your organization's HR operations.
                  </p>
                </div>
                <div className="p-8">
                  <ul className="space-y-3">
                    {[
                      "Employee onboarding & management",
                      "Attendance & leave approvals",
                      "Payroll processing & reports",
                      "Policy & document management",
                      "Role-based access control",
                      "Comprehensive analytics"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" asChild>
                    <Link to={user ? getDashboardLink() : "/auth"}>
                      Access Admin Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Employee Portal */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/5 p-8 border-b">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <UserCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Employee Portal</h3>
                  <p className="text-muted-foreground">
                    Self-service tools for every team member.
                  </p>
                </div>
                <div className="p-8">
                  <ul className="space-y-3">
                    {[
                      "Personal profile management",
                      "Clock in/out & attendance view",
                      "Leave requests & balance",
                      "Payslip downloads",
                      "Document access",
                      "Helpdesk support"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-6" asChild>
                    <Link to={user ? getDashboardLink() : "/auth"}>
                      Access Employee Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground">
              Setting up your HR system has never been easier. Get up and running in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-border" />
            
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-6 relative z-10">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your HR Operations?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of organizations that have simplified their HR management with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg">
                <Link to={user ? getDashboardLink() : "/auth"}>
                  {user ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={branding?.companyLogo || undefined} alt={companyName} />
                  <AvatarFallback className="rounded-lg bg-primary">
                    <Building2 className="h-4 w-4 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-lg font-bold">{companyName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern HR management platform for growing organizations.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#portals" className="hover:text-foreground transition-colors">Portals</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">Employees</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Attendance</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Payroll</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@hrms.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>New York, USA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
