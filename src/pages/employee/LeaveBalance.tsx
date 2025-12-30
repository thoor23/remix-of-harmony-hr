import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveBalances, useLeaveTypes } from "@/hooks/useCurrentEmployee";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function EmployeeLeaveBalance() {
  const { data: leaveBalances = [], isLoading: balancesLoading } = useLeaveBalances();
  const { data: leaveTypes = [], isLoading: typesLoading } = useLeaveTypes();

  const isLoading = balancesLoading || typesLoading;

  // Calculate totals
  const totalAvailable = leaveBalances.reduce((sum, b) => {
    const available = Number(b.total_days) - Number(b.used_days) - Number(b.pending_days);
    return sum + Math.max(0, available);
  }, 0);

  const totalUsed = leaveBalances.reduce((sum, b) => sum + Number(b.used_days), 0);
  const totalPending = leaveBalances.reduce((sum, b) => sum + Number(b.pending_days), 0);
  const totalEntitled = leaveBalances.reduce((sum, b) => sum + Number(b.total_days), 0);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Leave Balance" description="View your leave balances" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Leave Balance" description="View your leave balances for the current year" />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalEntitled}</p>
              <p className="text-sm text-muted-foreground">Total Entitled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalAvailable}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalUsed}</p>
              <p className="text-sm text-muted-foreground">Used</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalPending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaveBalances.map((balance) => {
          const type = leaveTypes.find((t: any) => t.id === balance.leave_type_id);
          const total = Number(balance.total_days);
          const used = Number(balance.used_days);
          const pending = Number(balance.pending_days);
          const available = Math.max(0, total - used - pending);
          const usagePercent = total > 0 ? ((used + pending) / total) * 100 : 0;

          return (
            <Card key={balance.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: type?.color || "#3B82F6" }}
                    />
                    <CardTitle className="text-base">{type?.name || "Leave"}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {type?.code || "N/A"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold" style={{ color: type?.color || "hsl(var(--primary))" }}>
                      {available}
                    </p>
                    <p className="text-sm text-muted-foreground">Days Available</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">of {total} days</p>
                  </div>
                </div>

                <Progress value={usagePercent} className="h-2" />

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="font-semibold">{total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="font-semibold text-destructive">{used}</p>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="font-semibold text-warning">{pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                {/* Leave Type Features */}
                <div className="flex gap-2 flex-wrap">
                  {type?.carry_forward && (
                    <Badge variant="secondary" className="text-xs">
                      Carry Forward
                    </Badge>
                  )}
                  {type?.encashable && (
                    <Badge variant="secondary" className="text-xs">
                      Encashable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {leaveBalances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No leave balances found. Please contact HR if you believe this is an error.
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
