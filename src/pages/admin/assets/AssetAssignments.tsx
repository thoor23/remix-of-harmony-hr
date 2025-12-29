import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetAssignments } from '@/hooks/useAssets';

export default function AssetAssignments() {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useAssetAssignments();

  return (
    <PageContainer
      title="Asset Assignments"
      description="View all asset assignment history"
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Returned Date</TableHead>
                <TableHead>Condition (Assign)</TableHead>
                <TableHead>Condition (Return)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : assignments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No assignment history found
                  </TableCell>
                </TableRow>
              ) : (
                assignments?.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/assets/${assignment.asset_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{assignment.asset?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.employee
                        ? `${assignment.employee.first_name} ${assignment.employee.last_name}`
                        : '-'}
                      {assignment.employee && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({assignment.employee.employee_id})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{assignment.location?.name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(assignment.assigned_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {assignment.returned_date
                        ? format(new Date(assignment.returned_date), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {assignment.condition_on_assign || '-'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {assignment.condition_on_return || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={assignment.returned_date ? 'secondary' : 'default'}
                      >
                        {assignment.returned_date ? 'Returned' : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
