import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmployeeCellProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  employeeId?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
}

export function EmployeeCell({
  avatarUrl,
  firstName,
  lastName,
  employeeId,
  email,
  size = "md",
}: EmployeeCellProps) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";

  const sizeClasses = {
    sm: { avatar: "h-7 w-7", name: "text-sm", id: "text-xs" },
    md: { avatar: "h-9 w-9", name: "text-sm font-medium", id: "text-xs" },
    lg: { avatar: "h-11 w-11", name: "text-base font-medium", id: "text-sm" },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-3">
      <Avatar className={classes.avatar}>
        <AvatarImage src={avatarUrl || undefined} alt={fullName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className={`${classes.name} truncate`}>{fullName}</span>
        {employeeId && (
          <span className={`${classes.id} text-muted-foreground`}>{employeeId}</span>
        )}
      </div>
    </div>
  );
}

export function EmployeeCellWithEmail({
  avatarUrl,
  firstName,
  lastName,
  employeeId,
  email,
  size = "md",
}: EmployeeCellProps) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";

  const sizeClasses = {
    sm: { avatar: "h-7 w-7", name: "text-sm", id: "text-xs" },
    md: { avatar: "h-9 w-9", name: "text-sm font-medium", id: "text-xs" },
    lg: { avatar: "h-11 w-11", name: "text-base font-medium", id: "text-sm" },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-3">
      <Avatar className={classes.avatar}>
        <AvatarImage src={avatarUrl || undefined} alt={fullName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className={`${classes.name} truncate`}>{fullName}</span>
        {employeeId && (
          <span className={`${classes.id} text-muted-foreground`}>{employeeId}</span>
        )}
      </div>
    </div>
  );
}
