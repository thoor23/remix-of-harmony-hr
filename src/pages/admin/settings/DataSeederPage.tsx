import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, AlertTriangle, CheckCircle, Loader2, Users, Building2, Calendar, FileText, MapPin, Store } from "lucide-react";

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

  return (
    <PageContainer>
      <PageHeader
        title="Database Seeder"
        description="Populate the database with sample data for testing"
      />
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Destructive Action</AlertTitle>
          <AlertDescription>
            Running the seeder will <strong>DELETE ALL EXISTING DATA</strong> including users, employees, 
            attendance records, leave requests, payroll data, and more. This action cannot be undone.
            Only use this in development/testing environments.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sample Data Generator
            </CardTitle>
            <CardDescription>
              Generate realistic sample data for the HRMS system including 50 employees, stores, offices, and all related data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">50</div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Store className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">7</div>
                <div className="text-sm text-muted-foreground">Stores</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Offices</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">60</div>
                <div className="text-sm text-muted-foreground">Days Attendance</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">Months Payroll</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Data to be generated:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>50 employees with full profiles (names, addresses, bank details, emergency contacts)</li>
                <li>8 departments with 16+ designations across all levels</li>
                <li>7 stores (5 India, 2 USA) with regional settings (timezone, currency, date format)</li>
                <li>5 offices (3 India, 2 USA) with regional settings</li>
                <li>Employee-location assignments and 10 sample transfers</li>
                <li>6 leave types with balances for each employee</li>
                <li>4 shifts with assignments linked to locations</li>
                <li>60 days of attendance records with realistic patterns</li>
                <li>100 leave requests (pending, approved, rejected)</li>
                <li>6 months of payroll data with payslips</li>
                <li>15 holidays for 2025</li>
                <li>10 announcements and 25 helpdesk tickets</li>
                <li>User roles: 2 Admins, 2 HR, 4 Store Managers, 4 Managers, 38 Employees</li>
              </ul>
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
                  Seed Database with 50 Employees
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(result.stats).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-sm text-muted-foreground capitalize">{key}</div>
                      </div>
                    ))}
                  </div>

                  {result.testCredentials && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Test Credentials (Password: Test@123)</h4>
                      <div className="space-y-1 text-sm font-mono">
                        {Object.entries(result.testCredentials).map(([role, cred]) => (
                          <div key={role}>
                            <span className="capitalize font-semibold">{role}:</span> {cred}
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
