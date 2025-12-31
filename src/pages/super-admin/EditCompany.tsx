import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Building2,
  Save,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Settings,
  LayoutGrid,
  Calendar,
  Clock,
  FileText,
  Package,
  Headphones,
  DollarSign,
  Briefcase,
  UserPlus,
  Receipt,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  website: string | null;
  domain: string | null;
  timezone: string | null;
  currency: string | null;
  date_format: string | null;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  max_employees: number | null;
  settings: {
    modules?: {
      attendance?: boolean;
      leaves?: boolean;
      payroll?: boolean;
      assets?: boolean;
      helpdesk?: boolean;
      recruitment?: boolean;
      onboarding?: boolean;
      expenses?: boolean;
      internal_billing?: boolean;
      documents?: boolean;
      shifts?: boolean;
    };
  } | null;
  created_at: string;
  updated_at: string;
}

const MODULES = [
  { key: "attendance", label: "Attendance", icon: Clock, description: "Track employee attendance and working hours" },
  { key: "leaves", label: "Leave Management", icon: Calendar, description: "Manage leave requests and approvals" },
  { key: "payroll", label: "Payroll", icon: DollarSign, description: "Salary processing and payslips" },
  { key: "assets", label: "Asset Management", icon: Package, description: "Track company assets and assignments" },
  { key: "helpdesk", label: "Helpdesk", icon: Headphones, description: "Internal support ticket system" },
  { key: "recruitment", label: "Recruitment", icon: UserPlus, description: "Job postings and applicant tracking" },
  { key: "onboarding", label: "Onboarding", icon: Briefcase, description: "New employee onboarding workflows" },
  { key: "expenses", label: "Expenses", icon: Receipt, description: "Expense claims and reimbursements" },
  { key: "internal_billing", label: "Internal Billing", icon: FileText, description: "Internal invoicing between departments" },
  { key: "documents", label: "Documents", icon: FileText, description: "Document management and storage" },
  { key: "shifts", label: "Shift Management", icon: Clock, description: "Manage employee shifts and rotations" },
] as const;

const SUBSCRIPTION_PLANS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const SUBSCRIPTION_STATUSES = [
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
];

const CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AED", label: "AED (د.إ)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "AUD", label: "AUD (A$)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const STEPS = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "Regional Settings", icon: Settings },
  { id: 3, title: "Subscription", icon: CreditCard },
  { id: 4, title: "Modules", icon: LayoutGrid },
];

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  domain: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  favicon_url: z.string().url().optional().or(z.literal("")),
  timezone: z.string(),
  currency: z.string(),
  date_format: z.string(),
  subscription_plan: z.string(),
  subscription_status: z.string(),
  subscription_expires_at: z.date().optional().nullable(),
  max_employees: z.number().min(1).optional().nullable(),
  modules: z.object({
    attendance: z.boolean(),
    leaves: z.boolean(),
    payroll: z.boolean(),
    assets: z.boolean(),
    helpdesk: z.boolean(),
    recruitment: z.boolean(),
    onboarding: z.boolean(),
    expenses: z.boolean(),
    internal_billing: z.boolean(),
    documents: z.boolean(),
    shifts: z.boolean(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCompany() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: company, isLoading } = useQuery({
    queryKey: ["super-admin", "company", code],
    queryFn: async () => {
      const response = await api.get<Company>(`/super-admin/companies/${code}`);
      return response;
    },
    enabled: !!code,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      domain: "",
      logo_url: "",
      favicon_url: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      date_format: "DD/MM/YYYY",
      subscription_plan: "starter",
      subscription_status: "active",
      subscription_expires_at: null,
      max_employees: 50,
      modules: {
        attendance: true,
        leaves: true,
        payroll: true,
        assets: true,
        helpdesk: true,
        recruitment: false,
        onboarding: false,
        expenses: false,
        internal_billing: false,
        documents: true,
        shifts: true,
      },
    },
    values: company ? {
      name: company.name,
      email: company.email,
      phone: company.phone || "",
      address: company.address || "",
      website: company.website || "",
      domain: company.domain || "",
      logo_url: company.logo_url || "",
      favicon_url: company.favicon_url || "",
      timezone: company.timezone || "Asia/Kolkata",
      currency: company.currency || "INR",
      date_format: company.date_format || "DD/MM/YYYY",
      subscription_plan: company.subscription_plan || "starter",
      subscription_status: company.subscription_status || "active",
      subscription_expires_at: company.subscription_expires_at ? new Date(company.subscription_expires_at) : null,
      max_employees: company.max_employees || 50,
      modules: {
        attendance: company.settings?.modules?.attendance ?? true,
        leaves: company.settings?.modules?.leaves ?? true,
        payroll: company.settings?.modules?.payroll ?? true,
        assets: company.settings?.modules?.assets ?? true,
        helpdesk: company.settings?.modules?.helpdesk ?? true,
        recruitment: company.settings?.modules?.recruitment ?? false,
        onboarding: company.settings?.modules?.onboarding ?? false,
        expenses: company.settings?.modules?.expenses ?? false,
        internal_billing: company.settings?.modules?.internal_billing ?? false,
        documents: company.settings?.modules?.documents ?? true,
        shifts: company.settings?.modules?.shifts ?? true,
      },
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!company) throw new Error("Company not found");
      
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        website: data.website || null,
        domain: data.domain || null,
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
        timezone: data.timezone,
        currency: data.currency,
        date_format: data.date_format,
        subscription_plan: data.subscription_plan,
        subscription_status: data.subscription_status,
        subscription_expires_at: data.subscription_expires_at?.toISOString() || null,
        max_employees: data.max_employees,
        settings: {
          ...company.settings,
          modules: data.modules,
        },
      };
      
      return api.put(`/super-admin/companies/${company.id}`, payload);
    },
    onSuccess: () => {
      toast.success("Company updated successfully");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "company", code] });
      navigate(`/super-admin/companies/${code}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["name", "email", "phone", "address", "website", "domain", "logo_url", "favicon_url"];
        break;
      case 2:
        fieldsToValidate = ["timezone", "currency", "date_format"];
        break;
      case 3:
        fieldsToValidate = ["subscription_plan", "subscription_status", "subscription_expires_at", "max_employees"];
        break;
      case 4:
        fieldsToValidate = ["modules"];
        break;
    }
    
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Edit Company" />
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer>
        <PageHeader title="Company Not Found" />
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Company not found</h3>
          <Link to="/super-admin/companies">
            <Button variant="link">Back to Companies</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit ${company.name}`}
        description={`Company Code: ${company.code}`}
      >
        <div className="flex gap-2">
          <Link to={`/super-admin/companies/${company.code}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Step Indicator */}
      <div className="max-w-4xl mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <span className={cn(
                    "text-xs mt-2 font-medium text-center",
                    isCurrent && "text-primary",
                    !isCurrent && "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-2 -mt-6",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic company details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="company@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="hr.company.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter company address" rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/logo.png" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="favicon_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/favicon.ico" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Regional Settings */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Timezone, currency, and date format preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Format</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DATE_FORMATS.map((df) => (
                              <SelectItem key={df.value} value={df.value}>
                                {df.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Subscription Management */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Management
                </CardTitle>
                <CardDescription>
                  Manage subscription plan, status, and limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="subscription_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUBSCRIPTION_PLANS.map((plan) => (
                              <SelectItem key={plan.value} value={plan.value}>
                                {plan.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscription_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUBSCRIPTION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscription_expires_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? format(field.value, "yyyy-MM-dd") : undefined}
                            onChange={(dateStr) => field.onChange(dateStr ? new Date(dateStr) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for no expiry
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_employees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Employees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="50"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of employees allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Module Management */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Module Management
                </CardTitle>
                <CardDescription>
                  Enable or disable specific modules for this company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {MODULES.map((module) => {
                    const Icon = module.icon;
                    return (
                      <FormField
                        key={module.key}
                        control={form.control}
                        name={`modules.${module.key}` as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base cursor-pointer">
                                  {module.label}
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  {module.description}
                                </FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Link to={`/super-admin/companies/${company.code}`}>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
