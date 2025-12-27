import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartCardProps {
  title: string;
  data: BarChartData[];
  dataKey?: string;
  secondaryDataKey?: string;
  className?: string;
  horizontal?: boolean;
}

export function BarChartCard({
  title,
  data,
  dataKey = "value",
  secondaryDataKey,
  className,
  horizontal = false,
}: BarChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={!horizontal}
                horizontal={horizontal}
              />
              {horizontal ? (
                <>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                </>
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey={dataKey}
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              {secondaryDataKey && (
                <Bar
                  dataKey={secondaryDataKey}
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
