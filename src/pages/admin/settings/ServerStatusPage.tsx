import { useServerStatus } from "@/hooks/useServerStatus";
import { ServiceGroup, OverallStatusBanner } from "@/components/settings/ServiceStatusCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Server, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";

export default function ServerStatusPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useServerStatus();

  return (
    <PageContainer>
      <PageHeader
        title="Server Status"
        description="Monitor all HRMS backend services in real-time"
      />
      
      <div className="space-y-6">
        {/* Overall Status Banner */}
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
            <div className="flex items-center gap-3 text-destructive">
              <Server className="h-6 w-6" />
              <span className="text-lg font-semibold">Unable to fetch status</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {error?.message || 'Failed to connect to health check service'}
            </p>
          </div>
        ) : data ? (
          <OverallStatusBanner status={data.status} lastChecked={data.timestamp} />
        ) : null}

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-foreground">{data.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Services</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{data.summary.operational}</div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-500">{data.summary.degraded}</div>
                <div className="text-sm text-muted-foreground">Degraded</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-500">{data.summary.outage}</div>
                <div className="text-sm text-muted-foreground">Outage</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">System Status</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              <ServiceGroup
                title="Core Services"
                services={data.services.core}
                defaultOpen={true}
              />
              <ServiceGroup
                title="Business Services"
                services={data.services.business}
                defaultOpen={true}
              />
              <ServiceGroup
                title="Support Services"
                services={data.services.support}
                defaultOpen={true}
              />
            </div>
          ) : null}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Auto-refreshing every 30 seconds
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
