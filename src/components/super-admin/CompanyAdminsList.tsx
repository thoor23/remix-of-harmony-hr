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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { Shield, Mail } from "lucide-react";
import { format } from "date-fns";

interface Admin {
  id: string;
  user_id: string;
  role: string;
  role_name: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface CompanyAdminsListProps {
  companyId: string;
}

export function CompanyAdminsList({ companyId }: CompanyAdminsListProps) {
  const { data: admins, isLoading } = useQuery({
    queryKey: ["super-admin", "company-admins", companyId],
    queryFn: async () => {
      const response = await api.get<{ data: Admin[] }>(
        `/super-admin/companies/${companyId}/admins`
      );
      return response.data || [];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (!admins || admins.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No admin users found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create an admin user to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {admin.first_name?.[0] || admin.email[0].toUpperCase()}
                      {admin.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {admin.first_name && admin.last_name
                        ? `${admin.first_name} ${admin.last_name}`
                        : admin.email}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {admin.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {admin.role_name || admin.role}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(admin.created_at), "MMM d, yyyy")}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
