import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <TableRow>
      {[...Array(cols)].map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <TableSkeleton rows={5} />
        </CardContent>
      </Card>
    </div>
  );
}
