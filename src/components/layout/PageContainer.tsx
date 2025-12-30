import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  function PageContainer({ children, className }, ref) {
    return (
      <div ref={ref} className={cn("flex-1 p-6 overflow-auto", className)}>
        {children}
      </div>
    );
  }
);

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  function PageHeader({ title, description, children }, ref) {
    return (
      <div ref={ref} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    );
  }
);
