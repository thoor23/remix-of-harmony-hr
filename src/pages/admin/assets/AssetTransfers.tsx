import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Package } from 'lucide-react';
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
import { useAssetTransfers } from '@/hooks/useAssets';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AssetTransfers() {
  const navigate = useNavigate();
  const { data: transfers, isLoading } = useAssetTransfers();

  return (
    <PageContainer
      title="Asset Transfers"
      description="View all asset transfer history between locations"
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead></TableHead>
                <TableHead>To Location</TableHead>
                <TableHead>Transfer Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Transferred By</TableHead>
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
              ) : transfers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No transfer history found
                  </TableCell>
                </TableRow>
              ) : (
                transfers?.map((transfer) => (
                  <TableRow
                    key={transfer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/assets/${transfer.asset_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transfer.asset?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.from_location ? (
                        <div className="flex items-center gap-2">
                          <span>{transfer.from_location.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {transfer.from_location.type === 'office' ? 'Office' : 'Store'}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{transfer.to_location?.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {transfer.to_location?.type === 'office' ? 'Office' : 'Store'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(transfer.transfer_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transfer.reason || '-'}
                    </TableCell>
                    <TableCell>
                      {transfer.transferred_by_employee
                        ? `${transfer.transferred_by_employee.first_name} ${transfer.transferred_by_employee.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[transfer.status]}>
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
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
