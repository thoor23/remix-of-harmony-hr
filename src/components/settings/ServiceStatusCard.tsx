import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ServiceStatus } from "@/hooks/useServerStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ServiceStatusItemProps {
  service: ServiceStatus;
}

export function ServiceStatusItem({ service }: ServiceStatusItemProps) {
  const getStatusIcon = () => {
    switch (service.status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (service.status) {
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'outage':
        return 'text-red-500';
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <span className="text-sm font-medium">{service.name}</span>
      </div>
      <div className="flex items-center gap-4">
        {service.error && (
          <span className="text-xs text-muted-foreground">{service.error}</span>
        )}
        <span className={cn("text-sm font-mono", getStatusColor())}>
          {service.responseTime}ms
        </span>
      </div>
    </div>
  );
}

interface ServiceGroupProps {
  title: string;
  services: ServiceStatus[];
  defaultOpen?: boolean;
}

export function ServiceGroup({ title, services, defaultOpen = true }: ServiceGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const allOperational = operationalCount === services.length;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              {allOperational ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-semibold">{title}</span>
              <span className="text-sm text-muted-foreground">
                ({operationalCount}/{services.length} operational)
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0 border-t">
            <div className="divide-y divide-border">
              {services.map((service) => (
                <ServiceStatusItem key={service.name} service={service} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface OverallStatusBannerProps {
  status: 'operational' | 'degraded' | 'outage';
  lastChecked: string;
}

export function OverallStatusBanner({ status, lastChecked }: OverallStatusBannerProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'operational':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          text: 'All Systems Operational',
          bgClass: 'bg-green-500/10 border-green-500/20',
          textClass: 'text-green-600 dark:text-green-400',
        };
      case 'degraded':
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          text: 'Some Systems Degraded',
          bgClass: 'bg-yellow-500/10 border-yellow-500/20',
          textClass: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'outage':
        return {
          icon: <XCircle className="h-6 w-6" />,
          text: 'System Outage Detected',
          bgClass: 'bg-red-500/10 border-red-500/20',
          textClass: 'text-red-600 dark:text-red-400',
        };
    }
  };

  const config = getStatusConfig();
  const timeSinceCheck = getTimeSince(lastChecked);

  return (
    <div className={cn(
      "rounded-lg border p-6 flex items-center justify-between",
      config.bgClass
    )}>
      <div className={cn("flex items-center gap-3", config.textClass)}>
        {config.icon}
        <span className="text-lg font-semibold">{config.text}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        Last checked: {timeSinceCheck}
      </span>
    </div>
  );
}

function getTimeSince(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return then.toLocaleTimeString();
}
