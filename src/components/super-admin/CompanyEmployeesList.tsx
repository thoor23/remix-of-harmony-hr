import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { Users, Mail, Phone } from "lucide-react";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  employment_type: string;
  avatar_url: string | null;
  department?: { name: string } | null;
  designation?: { name: string } | null;
}

interface CompanyEmployeesListProps {
  companyId: string;
}

export function CompanyEmployeesList({ companyId }: CompanyEmployeesListProps) {
  const { data: employees, isLoading } = useQuery({
    queryKey: ["super-admin", "company-employees", companyId],
    queryFn: async () => {
      const response = await api.get<{ data: Employee[] }>(
        `/super-admin/companies/${companyId}/employees`
      );
      return response.data || [];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.slice(0, 10).map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar_url || undefined} />
                    <AvatarFallback>
                      {employee.first_name?.[0]}
                      {employee.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employee_id}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {employee.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{employee.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{employee.department?.name || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.designation?.name || "-"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={employee.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {employee.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {employees.length > 10 && (
        <div className="p-3 text-center border-t">
          <p className="text-sm text-muted-foreground">
            Showing 10 of {employees.length} employees
          </p>
        </div>
      )}
    </div>
  );
}
