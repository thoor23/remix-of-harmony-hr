import { DailyUptime, StatusIncident } from "@/hooks/useStatusHistory";
import { format, parseISO } from "date-fns";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UptimeBarProps {
  data: DailyUptime[];
  days: number;
}

export function UptimeBar({ data, days }: UptimeBarProps) {
  const overallUptime = data.length > 0
    ? data.reduce((acc, d) => acc + d.uptimePercent, 0) / data.length
    : 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          Uptime: Last {days} days
        </h3>
        <span className="text-sm font-semibold text-emerald-400">
          {overallUptime.toFixed(2)}% uptime
        </span>
      </div>
      
      <div className="flex gap-0.5 h-10">
        {data.map((day, index) => (
          <div
            key={day.date}
            className={cn(
              "flex-1 rounded-sm transition-all hover:opacity-80 cursor-pointer group relative",
              day.status === 'operational' && "bg-emerald-500",
              day.status === 'degraded' && "bg-yellow-500",
              day.status === 'outage' && "bg-red-500",
              day.checkCount === 0 && "bg-zinc-700"
            )}
            title={`${format(parseISO(day.date), 'MMM d')}: ${day.uptimePercent.toFixed(1)}%`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                <div className="font-medium text-white">
                  {format(parseISO(day.date), 'MMM d, yyyy')}
                </div>
                <div className="text-zinc-400 mt-1">
                  {day.checkCount > 0 ? (
                    <>Uptime: {day.uptimePercent.toFixed(1)}%</>
                  ) : (
                    <>No data</>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const options = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-2 text-sm rounded-lg transition-colors",
            value === option.value
              ? "bg-zinc-700 text-white"
              : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface IncidentCardProps {
  incident: StatusIncident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const getStatusIcon = () => {
    switch (incident.status) {
      case 'resolved':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'monitoring':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'identified':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'investigating':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = () => {
    const colors = {
      minor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      major: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
      <span className={cn(
        "px-2 py-0.5 text-xs rounded-full border",
        colors[incident.severity]
      )}>
        {incident.severity}
      </span>
    );
  };

  const duration = incident.resolved_at
    ? `${Math.round((new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()) / 60000)} minutes`
    : 'Ongoing';

  return (
    <div className="border-b border-zinc-800 last:border-b-0 p-4">
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-white">{incident.title}</h4>
            {getSeverityBadge()}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
            <span>{format(parseISO(incident.started_at), 'MMM d, yyyy')}</span>
            <span>•</span>
            <span>{duration}</span>
            <span>•</span>
            <span className="capitalize">{incident.status}</span>
          </div>
          {incident.description && (
            <p className="mt-2 text-sm text-zinc-400">{incident.description}</p>
          )}
          {incident.affected_services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {incident.affected_services.map((service) => (
                <span
                  key={service}
                  className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NoIncidentsProps {
  days: number;
}

export function NoIncidents({ days }: NoIncidentsProps) {
  return (
    <div className="p-8 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
      <h4 className="font-medium text-white">No incidents</h4>
      <p className="text-sm text-zinc-500 mt-1">
        All systems have been operational for the last {days} days
      </p>
    </div>
  );
}
