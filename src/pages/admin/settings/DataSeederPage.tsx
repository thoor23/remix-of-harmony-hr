import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Database, AlertTriangle, CheckCircle, Loader2, Users, Building2, Calendar, FileText, 
  MapPin, Store, Package, Wrench, Bell, MessageSquare, ClipboardList, FileCheck, 
  RefreshCw, UserCog, ArrowRightLeft, Megaphone, LayoutTemplate
} from "lucide-react";

export default function DataSeederPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    stats?: Record<string, number>;
    testCredentials?: Record<string, string>;
    error?: string;
  } | null>(null);

  const handleSeedDatabase = async () => {
    if (!confirm("⚠️ WARNING: This will DELETE all existing data and create 50 new employees with sample data. This action cannot be undone. Are you sure?")) {
      return;
    }

    setIsSeeding(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-database');

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.success) {
        toast.success("Database seeded successfully!", {
          description: `Created ${data.stats?.employees || 0} employees with all related data.`
        });
      } else {
        toast.error("Seeding failed", {
          description: data.error || "Unknown error occurred"
        });
      }
    } catch (error: any) {
      console.error("Seeding error:", error);
      setResult({ success: false, error: error.message });
      toast.error("Failed to seed database", {
        description: error.message
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const dataCards = [
    { icon: Users, value: "50", label: "Employees", color: "text-blue-500" },
    { icon: Building2, value: "8", label: "Departments", color: "text-purple-500" },
    { icon: Store, value: "7", label: "Stores", color: "text-green-500" },
    { icon: MapPin, value: "5", label: "Offices", color: "text-orange-500" },
    { icon: Package, value: "100", label: "Assets", color: "text-cyan-500" },
    { icon: Wrench, value: "5", label: "Asset Categories", color: "text-red-500" },
    { icon: Calendar, value: "60", label: "Days Attendance", color: "text-indigo-500" },
    { icon: FileText, value: "6", label: "Months Payroll", color: "text-pink-500" },
    { icon: LayoutTemplate, value: "6", label: "Letter Templates", color: "text-amber-500" },
    { icon: FileCheck, value: "30", label: "Generated Letters", color: "text-teal-500" },
    { icon: Megaphone, value: "12", label: "Announcements", color: "text-rose-500" },
    { icon: Bell, value: "100+", label: "Notifications", color: "text-violet-500" },
    { icon: ClipboardList, value: "100+", label: "Documents", color: "text-lime-500" },
    { icon: RefreshCw, value: "20", label: "Regularization Req", color: "text-sky-500" },
    { icon: UserCog, value: "20", label: "Profile Changes", color: "text-fuchsia-500" },
    { icon: ArrowRightLeft, value: "20", label: "Shift Exchanges", color: "text-emerald-500" },
    { icon: MessageSquare, value: "25", label: "Helpdesk Tickets", color: "text-amber-600" },
    { icon: Wrench, value: "20", label: "Maint. Requests", color: "text-slate-500" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Database Seeder"
        description="Populate the database with comprehensive sample data for testing all features"
      />
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Destructive Action</AlertTitle>
          <AlertDescription>
            Running the seeder will <strong>DELETE ALL EXISTING DATA</strong> including users, employees, 
            attendance records, leave requests, payroll data, documents, and more. This action cannot be undone.
            Only use this in development/testing environments.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Comprehensive Sample Data Generator
            </CardTitle>
            <CardDescription>
              Generate realistic sample data for all HRMS features including 50 employees, 
              templates, documents, requests, and all related data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {dataCards.map((card) => (
                <div key={card.label} className="p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors">
                  <card.icon className={`h-6 w-6 mx-auto mb-1.5 ${card.color}`} />
                  <div className="text-xl font-bold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">👥 Employee & Organization</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>50 employees with full profiles (addresses, bank, emergency contacts)</li>
                  <li>8 departments with 16+ designations across all levels</li>
                  <li>7 stores + 5 offices with regional settings</li>
                  <li>Employee-location assignments and 10 transfers</li>
                  <li>User roles: 2 Admins, 2 HR, 4 Store Managers, 4 Managers</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-primary">📋 Templates & Letters</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>6 letter templates (Offer, Experience, Relieving, Increment, Promotion, Appointment)</li>
                  <li>30 generated letters for employees</li>
                  <li>6 announcement templates + 4 banner templates</li>
                  <li>12 active announcements</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">📄 Documents & Requests</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>100+ employee documents (ID proofs, certificates)</li>
                  <li>5 company-wide policy documents</li>
                  <li>20 attendance regularization requests</li>
                  <li>20 profile change requests</li>
                  <li>20 shift exchange requests</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">📦 Assets & Maintenance</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>5 asset categories (Laptops, Phones, Furniture, Vehicles, IT)</li>
                  <li>100 assets with various statuses & warranties</li>
                  <li>~40 asset assignments to employees</li>
                  <li>15 asset transfers + 30 maintenance records</li>
                  <li>20 employee maintenance requests</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">📅 Attendance & Leaves</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>60 days of attendance records with realistic patterns</li>
                  <li>6 leave types with balances for each employee</li>
                  <li>100 leave requests (pending, approved, rejected)</li>
                  <li>4 shifts with assignments linked to locations</li>
                  <li>15 holidays for 2025</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">💰 Payroll & Support</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Salary structures for all employees</li>
                  <li>6 months of payroll data with payslips</li>
                  <li>25 helpdesk tickets with messages</li>
                  <li>100+ notifications for users</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleSeedDatabase} 
              disabled={isSeeding}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database... This may take a few minutes
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database with Comprehensive Sample Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Seeding Completed Successfully
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Seeding Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success && result.stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Object.entries(result.stats).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.testCredentials && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Test Credentials (Password: Test@123)</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm font-mono">
                        {Object.entries(result.testCredentials).map(([role, cred]) => (
                          <div key={role} className="p-2 bg-background rounded border">
                            <span className="capitalize font-semibold text-primary">{role}:</span>
                            <br />
                            <span className="text-xs">{cred}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result.success && result.error && (
                <div className="text-destructive">
                  <p className="font-medium">Error:</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
