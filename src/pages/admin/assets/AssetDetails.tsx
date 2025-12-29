import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Package,
  Laptop,
  Smartphone,
  Armchair,
  Car,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAsset,
  useDeleteAsset,
  useAssetAssignments,
  useAssetTransfers,
  useAssetMaintenance,
  useAssignAsset,
  useUnassignAsset,
  useTransferAsset,
} from '@/hooks/useAssets';
import { useEmployees } from '@/hooks/useEmployees';
import { useAllLocations } from '@/hooks/useLocations';

const statusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop: Laptop,
  Smartphone: Smartphone,
  Armchair: Armchair,
  Car: Car,
  Wrench: Wrench,
  Package: Package,
};

export default function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id!);
  const { data: assignments } = useAssetAssignments(id);
  const { data: transfers } = useAssetTransfers(id);
  const { data: maintenanceRecords } = useAssetMaintenance(id);
  const { data: employees } = useEmployees();
  const { data: locations } = useAllLocations();
  const deleteAsset = useDeleteAsset();
  const assignAsset = useAssignAsset();
  const unassignAsset = useUnassignAsset();
  const transferAsset = useTransferAsset();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState('good');
  const [transferReason, setTransferReason] = useState('');

  const handleDelete = async () => {
    await deleteAsset.mutateAsync(id!);
    navigate('/admin/assets');
  };

  const handleAssign = async () => {
    await assignAsset.mutateAsync({
      asset_id: id!,
      employee_id: selectedEmployee,
      location_id: selectedLocation || undefined,
      notes: assignNotes || undefined,
    });
    setShowAssignDialog(false);
    setSelectedEmployee('');
    setAssignNotes('');
  };

  const handleUnassign = async () => {
    await unassignAsset.mutateAsync({
      assetId: id!,
      conditionOnReturn: returnCondition,
    });
    setShowUnassignDialog(false);
  };

  const handleTransfer = async () => {
    await transferAsset.mutateAsync({
      asset_id: id!,
      to_location_id: selectedLocation,
      reason: transferReason || undefined,
    });
    setShowTransferDialog(false);
    setSelectedLocation('');
    setTransferReason('');
  };

  const getCategoryIcon = (iconName: string | null) => {
    const IconComponent = categoryIcons[iconName || 'Package'] || Package;
    return <IconComponent className="h-6 w-6" />;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Asset Details" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!asset) {
    return (
      <PageContainer>
        <PageHeader title="Asset Not Found" />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">The requested asset was not found.</p>
            <Button className="mt-4" onClick={() => navigate('/admin/assets')}>
              Back to Assets
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate('/admin/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Button>
      </div>

      <PageHeader title={asset.name} description="View complete asset information">
        <Button variant="outline" onClick={() => navigate(`/admin/assets/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(asset.category?.icon || null)}
                <CardTitle>{asset.name}</CardTitle>
              </div>
              <Badge className={statusColors[asset.status]}>
                {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset Tag</p>
                <p className="font-mono font-medium">{asset.asset_tag}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{asset.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{asset.brand || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{asset.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-mono font-medium">{asset.serial_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition</p>
                <p className="font-medium capitalize">{asset.condition}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {asset.purchase_date ? format(new Date(asset.purchase_date), 'dd MMM yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Cost</p>
                <p className="font-medium">₹{asset.purchase_cost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                <p className="font-medium">
                  {asset.warranty_expiry
                    ? format(new Date(asset.warranty_expiry), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">
                  {asset.location ? (
                    <span>
                      {asset.location.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {asset.location.type === 'office' ? 'Office' : 'Store'}
                      </Badge>
                    </span>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {asset.assignee ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {asset.assignee.first_name} {asset.assignee.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{asset.assignee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Date</p>
                  <p className="font-medium">
                    {asset.assigned_date
                      ? format(new Date(asset.assigned_date), 'dd MMM yyyy')
                      : '-'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowUnassignDialog(true)}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Unassign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">This asset is not assigned to anyone.</p>
                <Button className="w-full" onClick={() => setShowAssignDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Asset
                </Button>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTransferDialog(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer Location
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Card className="mt-6">
        <Tabs defaultValue="assignments">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="assignments">Assignment History</TabsTrigger>
              <TabsTrigger value="transfers">Transfer History</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="assignments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Returned Date</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No assignment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments?.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {a.employee?.first_name} {a.employee?.last_name}
                        </TableCell>
                        <TableCell>{a.location?.name || '-'}</TableCell>
                        <TableCell>{format(new Date(a.assigned_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          {a.returned_date ? format(new Date(a.returned_date), 'dd MMM yyyy') : 'Active'}
                        </TableCell>
                        <TableCell className="capitalize">{a.condition_on_assign || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="transfers">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No transfer history
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers?.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.from_location?.name || '-'}</TableCell>
                        <TableCell>{t.to_location?.name}</TableCell>
                        <TableCell>{format(new Date(t.transfer_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{t.reason || '-'}</TableCell>
                        <TableCell>
                          {t.transferred_by_employee
                            ? `${t.transferred_by_employee.first_name} ${t.transferred_by_employee.last_name}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="maintenance">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No maintenance records
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenanceRecords?.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="capitalize">{m.type}</TableCell>
                        <TableCell>{m.description || '-'}</TableCell>
                        <TableCell>
                          {m.scheduled_date ? format(new Date(m.scheduled_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {m.completed_date ? format(new Date(m.completed_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>₹{m.cost.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{m.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAsset.isPending}>
              {deleteAsset.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>Assign this asset to an employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Assignment notes..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedEmployee || assignAsset.isPending}>
              {assignAsset.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Dialog */}
      <Dialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Asset</DialogTitle>
            <DialogDescription>Return this asset from the current assignee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Condition on Return</Label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnassignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnassign} disabled={unassignAsset.isPending}>
              {unassignAsset.isPending ? 'Processing...' : 'Unassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>Transfer this asset to another location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Location</Label>
              <p className="text-sm text-muted-foreground">{asset.location?.name || 'Not assigned'}</p>
            </div>
            <div className="space-y-2">
              <Label>New Location *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    ?.filter((loc) => loc.id !== asset.location_id)
                    .map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type === 'office' ? 'Office' : 'Store'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Transfer reason..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={!selectedLocation || transferAsset.isPending}>
              {transferAsset.isPending ? 'Transferring...' : 'Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
