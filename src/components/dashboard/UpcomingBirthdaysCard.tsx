import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cake } from "lucide-react";
import { useUpcomingBirthdays } from "@/hooks/useDashboard";
import { format } from "date-fns";

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function UpcomingBirthdaysCard() {
  const currentMonth = (new Date().getMonth() + 1).toString();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const { data: birthdays = [], isLoading } = useUpcomingBirthdays(parseInt(selectedMonth));

  return (
    <Card className="dark:border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Employee Birthdays
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : birthdays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No birthdays in {months.find(m => m.value === selectedMonth)?.label}</p>
            </div>
          ) : (
            birthdays.map((birthday, index) => {
              const initials = `${birthday.first_name?.[0] || ''}${birthday.last_name?.[0] || ''}`;
              const birthDate = new Date(birthday.date_of_birth);
              
              return (
                <div
                  key={birthday.id || index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={birthday.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-pink-500/10 text-pink-500">
                      {initials || <Cake className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {birthday.first_name} {birthday.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {birthday.department_name || "No Department"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {format(birthDate, "MMM d")}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
