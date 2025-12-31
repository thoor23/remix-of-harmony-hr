import { useState } from "react";
import { Link } from "react-router-dom";
import { useStatusHistory } from "@/hooks/useStatusHistory";
import { 
  UptimeBar, 
  DateRangeSelector, 
  IncidentCard, 
  NoIncidents 
} from "@/components/status/StatusHistoryComponents";
import { PublicStatusFooter } from "@/components/status/PublicStatusComponents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function StatusHistoryPage() {
  const [days, setDays] = useState(90);
  const { data, isLoading, error } = useStatusHistory(days);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['status-history'] });
    setTimeout(() => setIsRefreshing(false), 500);
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
          <Link to="/status">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to current status
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Uptime Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Uptime History</h1>
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

          {isLoading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-zinc-800 rounded w-1/4" />
                <div className="h-10 bg-zinc-800 rounded" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-red-400">
              Unable to load history. Please try again later.
            </div>
          ) : data && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <UptimeBar data={data.dailyUptime} days={days} />
            </div>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="mb-8">
          <DateRangeSelector value={days} onChange={setDays} />
        </div>

        {/* Past Incidents Section */}
        <div>
          <h2 className="text-lg font-medium text-white mb-4">Past Incidents</h2>
          
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                Unable to load incidents.
              </div>
            ) : data?.incidents && data.incidents.length > 0 ? (
              data.incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            ) : (
              <NoIncidents days={days} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicStatusFooter />
    </div>
  );
}
