import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

// Generate mock data for the last 30 days
const generateMockData = () => {
  const data = [];
  const now = new Date();
  let cumulativeCompanies = 5;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random growth between 0-2 companies per day
    const newCompanies = Math.floor(Math.random() * 3);
    cumulativeCompanies += newCompanies;
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      companies: cumulativeCompanies,
      new: newCompanies,
    });
  }
  
  return data;
};

interface CompanyGrowthChartProps {
  data?: Array<{ date: string; companies: number; new: number }>;
}

export function CompanyGrowthChart({ data = generateMockData() }: CompanyGrowthChartProps) {
  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Company Growth (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="companies"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompanies)"
              name="Total Companies"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
