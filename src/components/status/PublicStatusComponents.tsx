import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type StatusType = 'operational' | 'degraded' | 'outage';

interface ServiceStatus {
  name: string;
  status: StatusType;
}

interface PublicStatusBannerProps {
  status: StatusType;
  isLoading?: boolean;
}

export function PublicStatusBanner({ status, isLoading }: PublicStatusBannerProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 rounded-full bg-zinc-600 animate-pulse" />
          <span className="text-lg text-zinc-400">Checking system status...</span>
        </div>
      </div>
    );
  }

  const config = {
    operational: {
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      title: "We're fully operational",
      subtitle: "We're not aware of any issues.",
    },
    degraded: {
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      title: "Partial system outage",
      subtitle: "Some services are experiencing issues.",
    },
    outage: {
      bg: "bg-red-500/10 border-red-500/20",
      icon: XCircle,
      iconColor: "text-red-400",
      title: "Major system outage",
      subtitle: "We're working to resolve the issue.",
    },
  };

  const { bg, icon: Icon, iconColor, title, subtitle } = config[status];

  return (
    <div className={cn("rounded-xl border p-6 text-center", bg)}>
      <div className="flex items-center justify-center gap-3 mb-2">
        <Icon className={cn("h-6 w-6", iconColor)} />
        <span className="text-xl font-medium text-white">{title}</span>
      </div>
      <p className="text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

interface PublicServiceItemProps {
  name: string;
  status: StatusType;
  componentCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

export function PublicServiceItem({ 
  name, 
  status, 
  componentCount, 
  isExpanded, 
  onToggle,
  children 
}: PublicServiceItemProps) {
  const statusColors = {
    operational: "bg-emerald-400",
    degraded: "bg-amber-400",
    outage: "bg-red-400",
  };

  const hasChildren = componentCount && componentCount > 0;

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <div 
        className={cn(
          "flex items-center justify-between py-4 px-4",
          hasChildren && "cursor-pointer hover:bg-zinc-800/30 transition-colors"
        )}
        onClick={hasChildren ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          <div className={cn("h-2.5 w-2.5 rounded-full", statusColors[status])} />
          <span className="text-white font-medium">{name}</span>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-sm">{componentCount} components</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
      {hasChildren && isExpanded && children && (
        <div className="bg-zinc-900/50 border-t border-zinc-800">
          {children}
        </div>
      )}
    </div>
  );
}

interface PublicServiceGroupProps {
  name: string;
  services: ServiceStatus[];
}

export function PublicServiceGroup({ name, services }: PublicServiceGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const overallStatus: StatusType = services.some(s => s.status === 'outage') 
    ? 'outage' 
    : services.some(s => s.status === 'degraded') 
      ? 'degraded' 
      : 'operational';

  const statusColors = {
    operational: "bg-emerald-400",
    degraded: "bg-amber-400",
    outage: "bg-red-400",
  };

  return (
    <PublicServiceItem
      name={name}
      status={overallStatus}
      componentCount={services.length}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      {services.map((service) => (
        <div key={service.name} className="flex items-center gap-3 py-3 px-6 pl-10">
          <div className={cn("h-2 w-2 rounded-full", statusColors[service.status])} />
          <span className="text-zinc-300 text-sm">{service.name}</span>
        </div>
      ))}
    </PublicServiceItem>
  );
}

interface PublicStatusFooterProps {
  companyName?: string;
}

export function PublicStatusFooter({ companyName = "HRMS" }: PublicStatusFooterProps) {
  return (
    <footer className="border-t border-zinc-800 py-8 text-center">
      <p className="text-sm text-zinc-500">
        Powered by {companyName} • © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
