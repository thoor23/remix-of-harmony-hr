import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  CalendarX,
  Store,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useMyStores, useStoreEmployees, Store as StoreType } from "@/hooks/useStores";
import { useState, useEffect } from "react";

export default function StoreManagerDashboard() {
  const { data: myStoreAssignments = [], isLoading: loadingStores } = useMyStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  
  // Get unique stores from assignments
  const myStores = myStoreAssignments
    .filter(a => a.store)
    .map(a => a.store as StoreType)
    .filter((store, index, self) => 
      index === self.findIndex(s => s.id === store.id)
    );

  // Auto-select first store
  useEffect(() => {
    if (myStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(myStores[0].id);
    }
  }, [myStores, selectedStoreId]);

  const { data: storeEmployees = [], isLoading: loadingEmployees } = useStoreEmployees(selectedStoreId);
  
  const selectedStore = myStores.find(s => s.id === selectedStoreId);
  
  // Calculate stats
  const activeEmployees = storeEmployees.filter(a => a.is_active && a.employee?.status === "active");
  const totalEmployees = activeEmployees.length;
  
  // Mock stats - in real app, these would come from API
  const presentToday = Math.floor(totalEmployees * 0.85);
  const onLeave = Math.floor(totalEmployees * 0.1);
  const pendingRequests = Math.floor(Math.random() * 5);

  if (loadingStores) {
    return (
      <PageContainer>
        <PageHeader title="Store Dashboard" description="Overview of your store performance" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (myStores.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Store Dashboard" description="Overview of your store performance" />
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Stores Assigned</h3>
          <p className="text-muted-foreground">
            You don't have any stores assigned to manage. Please contact an administrator.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader
          title="Store Dashboard"
          description={selectedStore ? `Managing: ${selectedStore.name}` : "Overview of your store performance"}
        />
        
        {myStores.length > 1 && (
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[200px]">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {myStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <EnhancedStatCard
          title="Store Employees"
          value={totalEmployees}
          subtitle="Assigned to this store"
          icon={Users}
          variant="primary"
        />
        <EnhancedStatCard
          title="Present Today"
          value={presentToday}
          subtitle={`${Math.round((presentToday / totalEmployees) * 100) || 0}% attendance`}
          icon={UserCheck}
          variant="success"
        />
        <EnhancedStatCard
          title="On Leave"
          value={onLeave}
          subtitle="Today"
          icon={CalendarX}
        />
        <EnhancedStatCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Needs attention"
          icon={Clock}
          variant={pendingRequests > 0 ? "warning" : "default"}
        />
      </div>

      {/* Store Info Card */}
      {selectedStore && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Code:</span>
                <p className="font-medium">{selectedStore.code}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">
                  {[selectedStore.address_city, selectedStore.address_state].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Hours:</span>
                <p className="font-medium">
                  {selectedStore.opening_time && selectedStore.closing_time
                    ? `${selectedStore.opening_time} - ${selectedStore.closing_time}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact:</span>
                <p className="font-medium">{selectedStore.phone || selectedStore.email || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Employees ({totalEmployees})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingEmployees ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activeEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees assigned to this store
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.employee?.employee_id}
                      </TableCell>
                      <TableCell>
                        {`${assignment.employee?.first_name || ""} ${assignment.employee?.last_name || ""}`.trim() || "N/A"}
                      </TableCell>
                      <TableCell>{assignment.employee?.department?.name || "—"}</TableCell>
                      <TableCell>{assignment.employee?.designation?.name || "—"}</TableCell>
                      <TableCell>
                        {assignment.is_primary ? (
                          <Badge variant="default">Primary</Badge>
                        ) : (
                          <Badge variant="secondary">Secondary</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={assignment.employee?.status === "active" ? "default" : "secondary"}
                        >
                          {assignment.employee?.status || "Unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
