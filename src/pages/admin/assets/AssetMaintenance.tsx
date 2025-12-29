import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetMaintenance, useCreateMaintenance, useAssets } from '@/hooks/useAssets';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const typeColors: Record<string, string> = {
  repair: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  service: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  upgrade: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function AssetMaintenance() {
  const navigate = useNavigate();
  const { data: maintenanceRecords, isLoading } = useAssetMaintenance();
  const { data: assets } = useAssets();
  const createMaintenance = useCreateMaintenance();

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    type: 'service',
    description: '',
    cost: '',
    vendor: '',
    scheduled_date: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      asset_id: '',
      type: 'service',
      description: '',
      cost: '',
      vendor: '',
      scheduled_date: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    await createMaintenance.mutateAsync({
      asset_id: formData.asset_id,
      type: formData.type,
      description: formData.description || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      vendor: formData.vendor || undefined,
      scheduled_date: formData.scheduled_date || undefined,
      notes: formData.notes || undefined,
    });
    setShowDialog(false);
    resetForm();
  };

  return (
    <PageContainer
      title="Asset Maintenance"
      description="Schedule and track asset maintenance"
      action={
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Cost</TableHead>
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
              ) : maintenanceRecords?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No maintenance records found
                  </TableCell>
                </TableRow>
              ) : (
                maintenanceRecords?.map((record) => (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/assets/${record.asset_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{record.asset?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[record.type]}>
                        {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.description || '-'}
                    </TableCell>
                    <TableCell>{record.vendor || '-'}</TableCell>
                    <TableCell>
                      {record.scheduled_date
                        ? format(new Date(record.scheduled_date), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.completed_date
                        ? format(new Date(record.completed_date), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>₹{record.cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.status]}>
                        {record.status === 'in_progress'
                          ? 'In Progress'
                          : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Maintenance Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Create a new maintenance record for an asset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset *</Label>
              <Select
                value={formData.asset_id}
                onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Maintenance description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  placeholder="Service provider"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Cost (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.asset_id || createMaintenance.isPending}
            >
              {createMaintenance.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
