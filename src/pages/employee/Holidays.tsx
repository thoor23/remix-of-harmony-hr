import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Flag, Sun, Building2 } from "lucide-react";
import { holidays } from "@/data/mockData";

export default function HolidayCalendar() {
  const [selectedYear, setSelectedYear] = useState("2025");

  const typeIcons: Record<string, React.ReactNode> = {
    national: <Flag className="h-4 w-4" />,
    regional: <Sun className="h-4 w-4" />,
    company: <Building2 className="h-4 w-4" />,
    optional: <Calendar className="h-4 w-4" />,
  };

  const typeColors: Record<string, string> = {
    national: "bg-primary text-primary-foreground",
    regional: "bg-info text-info-foreground",
    company: "bg-success text-success-foreground",
    optional: "bg-warning text-warning-foreground",
  };

  // Group holidays by month
  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const month = new Date(holiday.date).toLocaleDateString("en-US", { month: "long" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {} as Record<string, typeof holidays>);

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= new Date())
    .slice(0, 3);

  return (
    <PageContainer>
      <PageHeader title="Holiday Calendar" description="View upcoming holidays and plan your time off" />

      {/* Upcoming Holidays */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {upcomingHolidays.map((holiday) => (
          <Card key={holiday.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{holiday.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(holiday.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge className={typeColors[holiday.type]}>
                  {holiday.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend & Year Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge className={typeColors.national}>National</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={typeColors.regional}>Regional</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={typeColors.company}>Company</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={typeColors.optional}>Optional</Badge>
          </div>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Holiday List by Month */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
          <Card key={month}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {month}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${typeColors[holiday.type]}`}
                      >
                        {typeIcons[holiday.type]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(holiday.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{holidays.length}</p>
              <p className="text-sm text-muted-foreground">Total Holidays</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {holidays.filter((h) => h.type === "national").length}
              </p>
              <p className="text-sm text-muted-foreground">National Holidays</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {holidays.filter((h) => h.type === "company").length}
              </p>
              <p className="text-sm text-muted-foreground">Company Holidays</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {holidays.filter((h) => h.type === "optional").length}
              </p>
              <p className="text-sm text-muted-foreground">Optional Holidays</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
