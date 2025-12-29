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
    <Card className="dark:border-border/50 h-[320px] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            Birthdays
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue placeholder="Month" />
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
      <CardContent className="flex-1 overflow-hidden pt-0">
        <div className="h-full overflow-y-auto pr-2 space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))
          ) : birthdays.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Cake className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No birthdays in {months.find(m => m.value === selectedMonth)?.label}</p>
            </div>
          ) : (
            birthdays.map((birthday, index) => {
              const initials = `${birthday.first_name?.[0] || ''}${birthday.last_name?.[0] || ''}`;
              const birthDate = new Date(birthday.date_of_birth);
              
              return (
                <div
                  key={birthday.id || index}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={birthday.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-pink-500/10 text-pink-500">
                      {initials || <Cake className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {birthday.first_name} {birthday.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {birthday.department_name || "No Dept"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 h-5">
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
