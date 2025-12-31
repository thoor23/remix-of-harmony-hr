import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users } from "lucide-react";

interface CompanyData {
  name: string;
  employees: number;
}

interface EmployeeDistributionChartProps {
  companies: Array<{ name: string; employee_count?: number }>;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function EmployeeDistributionChart({ companies }: EmployeeDistributionChartProps) {
  // Get top 6 companies by employee count
  const data: CompanyData[] = companies
    .filter(c => c.employee_count && c.employee_count > 0)
    .sort((a, b) => (b.employee_count || 0) - (a.employee_count || 0))
    .slice(0, 6)
    .map(c => ({
      name: c.name.length > 12 ? c.name.substring(0, 12) + "..." : c.name,
      employees: c.employee_count || 0,
    }));

  if (data.length === 0) {
    return (
      <Card className="dark:border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employee Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No employee data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Employee Distribution (Top Companies)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
            <XAxis 
              type="number" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} employees`, "Employees"]}
            />
            <Bar dataKey="employees" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
