import { useServerStatus } from "@/hooks/useServerStatus";
import { 
  PublicStatusBanner, 
  PublicServiceItem, 
  PublicServiceGroup,
  PublicStatusFooter 
} from "@/components/status/PublicStatusComponents";
import { SubscribeModal } from "@/components/status/SubscribeModal";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, History, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StatusPage() {
  const { data, isLoading, error } = useServerStatus(30000);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['server-status'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate overall status
  const overallStatus = error ? 'outage' : (data?.status || 'operational');

  // Group services for public display
  const coreServices = data?.services?.core || [];
  const businessServices = data?.services?.business || [];
  const supportServices = data?.services?.support || [];

  // Map to simplified public format
  const mapStatus = (status: string) => {
    if (status === 'operational') return 'operational' as const;
    if (status === 'degraded') return 'degraded' as const;
    return 'outage' as const;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">HRMS Status</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => setShowSubscribeModal(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Subscribe to updates
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Status Banner */}
        <PublicStatusBanner 
          status={mapStatus(overallStatus)} 
          isLoading={isLoading} 
        />

        {/* System Status Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">System status</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500">
                Loading status...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                Unable to fetch status. Please try again later.
              </div>
            ) : (
              <>
                {/* Core Services */}
                {coreServices.map((service) => (
                  <PublicServiceItem 
                    key={service.name}
                    name={service.name} 
                    status={mapStatus(service.status)} 
                  />
                ))}

                {/* Business Services Group */}
                {businessServices.length > 0 && (
                  <PublicServiceGroup
                    name="Business Services"
                    services={businessServices.map(s => ({
                      name: s.name,
                      status: mapStatus(s.status)
                    }))}
                  />
                )}

                {/* Support Services Group */}
                {supportServices.length > 0 && (
                  <PublicServiceGroup
                    name="Support Services"
                    services={supportServices.map(s => ({
                      name: s.name,
                      status: mapStatus(s.status)
                    }))}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* View History Link */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => navigate('/status/history')}
          >
            <History className="h-4 w-4 mr-2" />
            View history
          </Button>
        </div>
      </main>

      {/* Footer */}
      <PublicStatusFooter />

      {/* Subscribe Modal */}
      <SubscribeModal 
        open={showSubscribeModal} 
        onOpenChange={setShowSubscribeModal} 
      />
    </div>
  );
}
