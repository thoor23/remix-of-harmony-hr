import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  count?: number;
  badge?: string;
}

export function ReportCard({
  title,
  description,
  icon,
  href,
  count,
  badge,
}: ReportCardProps) {
  return (
    <Link to={href}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg mb-1 flex items-center justify-between">
            {title}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
          {count !== undefined && (
            <p className="text-2xl font-bold text-primary mt-2">{count}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
