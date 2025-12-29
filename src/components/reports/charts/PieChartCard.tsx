import { TrendingUp, TrendingDown } from "lucide-react";
import { Pie, PieChart, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
  showLegend?: boolean;
}

export function PieChartCard({ 
  title, 
  description,
  data, 
  className,
  footerTrend,
  footerDescription,
  showLegend = true
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
      <CardContent className="flex flex-col items-center pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="key"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
        {showLegend && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
            {chartData.map((item, index) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div 
                  className="h-2.5 w-2.5 shrink-0 rounded-sm" 
                  style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </div>
        )}
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
