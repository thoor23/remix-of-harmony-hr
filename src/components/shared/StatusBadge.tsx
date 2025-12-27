import { cn } from "@/lib/utils";

export type StatusType = 
  | "active" 
  | "inactive" 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "present" 
  | "absent" 
  | "late" 
  | "on-leave" 
  | "half-day"
  | "holiday"
  | "weekend"
  | "open"
  | "in-progress"
  | "resolved"
  | "closed"
  | "draft"
  | "generated"
  | "paid"
  | "cancelled"
  | "terminated";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-muted" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  present: { label: "Present", className: "bg-success/10 text-success border-success/20" },
  absent: { label: "Absent", className: "bg-destructive/10 text-destructive border-destructive/20" },
  late: { label: "Late", className: "bg-warning/10 text-warning border-warning/20" },
  "on-leave": { label: "On Leave", className: "bg-info/10 text-info border-info/20" },
  "half-day": { label: "Half Day", className: "bg-warning/10 text-warning border-warning/20" },
  holiday: { label: "Holiday", className: "bg-primary/10 text-primary border-primary/20" },
  weekend: { label: "Weekend", className: "bg-muted text-muted-foreground border-muted" },
  open: { label: "Open", className: "bg-info/10 text-info border-info/20" },
  "in-progress": { label: "In Progress", className: "bg-warning/10 text-warning border-warning/20" },
  resolved: { label: "Resolved", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-muted" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted" },
  generated: { label: "Generated", className: "bg-info/10 text-info border-info/20" },
  paid: { label: "Paid", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-muted" },
  terminated: { label: "Terminated", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
