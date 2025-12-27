import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface AreaConfig {
  dataKey: string;
  color?: string;
  name?: string;
}

interface AreaChartCardProps {
  title: string;
  data: AreaChartData[];
  areas: AreaConfig[];
  className?: string;
  stacked?: boolean;
}

export function AreaChartCard({
  title,
  data,
  areas,
  className,
  stacked = false,
}: AreaChartCardProps) {
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                {areas.map((area, index) => (
                  <linearGradient
                    key={`gradient-${area.dataKey}`}
                    id={`gradient-${area.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={area.color || COLORS[index % COLORS.length]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={area.color || COLORS[index % COLORS.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              {areas.length > 1 && (
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-muted-foreground">{value}</span>
                  )}
                />
              )}
              {areas.map((area, index) => (
                <Area
                  key={area.dataKey}
                  type="monotone"
                  dataKey={area.dataKey}
                  name={area.name || area.dataKey}
                  stroke={area.color || COLORS[index % COLORS.length]}
                  fill={`url(#gradient-${area.dataKey})`}
                  strokeWidth={2}
                  stackId={stacked ? "1" : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
