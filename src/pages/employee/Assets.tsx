import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Laptop, Monitor, Smartphone, Printer, HardDrive, Tag, Calendar } from "lucide-react";
import { useMyAssets } from "@/hooks/useMyAssets";
import { format } from "date-fns";

const categoryIcons: Record<string, React.ElementType> = {
  laptop: Laptop,
  computer: Monitor,
  phone: Smartphone,
  printer: Printer,
  storage: HardDrive,
  default: Package,
};

const conditionColors: Record<string, string> = {
  excellent: "bg-success/10 text-success border-success/20",
  good: "bg-info/10 text-info border-info/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function EmployeeAssets() {
  const { data: assets = [], isLoading } = useMyAssets();

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Assets" description="View assets assigned to you" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="My Assets" description="View assets assigned to you" />

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Assets Assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any assets assigned to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} assigned to you
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const categoryName = asset.category?.name?.toLowerCase() || 'default';
              const IconComponent = categoryIcons[categoryName] || categoryIcons.default;
              const conditionClass = conditionColors[asset.condition?.toLowerCase() || ''] || '';

              return (
                <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {asset.image_url && (
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={asset.image_url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {asset.brand} {asset.model}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {asset.asset_tag}
                      </Badge>
                      {asset.category?.name && (
                        <Badge variant="secondary">{asset.category.name}</Badge>
                      )}
                      {asset.condition && (
                        <Badge variant="outline" className={conditionClass}>
                          {asset.condition}
                        </Badge>
                      )}
                    </div>

                    {asset.serial_number && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Serial: </span>
                        <span className="font-mono">{asset.serial_number}</span>
                      </div>
                    )}

                    {asset.assigned_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Assigned {format(new Date(asset.assigned_date), "MMM dd, yyyy")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
