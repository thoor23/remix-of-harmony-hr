import { TrendingUp, TrendingDown } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PieChartData {
  name: string;
  value: number;
  fill?: string;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartData[];
  className?: string;
  footerTrend?: {
    value: number;
    label: string;
  };
  footerDescription?: string;
}

export function PieChartCard({ 
  title, 
  description,
  data, 
  className,
  footerTrend,
  footerDescription 
}: PieChartCardProps) {
  // Generate chart config from data
  const chartConfig: ChartConfig = {
    value: { label: "Value" },
    ...data.reduce((acc, item, index) => {
      const key = item.name.toLowerCase().replace(/\s+/g, '-');
      acc[key] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    }, {} as ChartConfig),
  };

  // Transform data to include fill property
  const chartData = data.map((item, index) => ({
    ...item,
    key: item.name.toLowerCase().replace(/\s+/g, '-'),
    fill: item.fill || `var(--color-${item.name.toLowerCase().replace(/\s+/g, '-')})`,
  }));

  return (
    <Card className={className}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {(footerTrend || footerDescription) && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footerTrend && (
            <div className="flex items-center gap-2 font-medium leading-none">
              {footerTrend.value >= 0 ? "Trending up" : "Trending down"} by {Math.abs(footerTrend.value)}% {footerTrend.label}
              {footerTrend.value >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
          {footerDescription && (
            <div className="leading-none text-muted-foreground">
              {footerDescription}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
