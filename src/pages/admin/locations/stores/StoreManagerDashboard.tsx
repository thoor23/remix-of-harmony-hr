import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Clock, CalendarX, Store, UserCheck, AlertCircle } from "lucide-react";
import { useMyLocations, useLocationEmployees, Location } from "@/hooks/useLocations";
import { useState, useEffect } from "react";

export default function StoreManagerDashboard() {
  const { data: myStoreAssignments = [], isLoading: loadingStores } = useMyLocations();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  
  const myStores = myStoreAssignments
    .filter(a => a.store && a.store.type === 'store')
    .map(a => a.store as Location)
    .filter((store, index, self) => index === self.findIndex(s => s.id === store.id));

  useEffect(() => {
    if (myStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(myStores[0].id);
    }
  }, [myStores, selectedStoreId]);

  const { data: storeEmployees = [], isLoading: loadingEmployees } = useLocationEmployees(selectedStoreId);
  const selectedStore = myStores.find(s => s.id === selectedStoreId);
  const activeEmployees = storeEmployees.filter(a => a.is_active && a.employee?.status === "active");
  const totalEmployees = activeEmployees.length;
  const presentToday = Math.floor(totalEmployees * 0.85);
  const onLeave = Math.floor(totalEmployees * 0.1);
  const pendingRequests = Math.floor(Math.random() * 5);

  if (loadingStores) {
    return (
      <PageContainer>
        <PageHeader title="Store Dashboard" description="Overview of your store performance" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></Card>)}
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
          <p className="text-muted-foreground">You don't have any stores assigned to manage.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader title="Store Dashboard" description={selectedStore ? `Managing: ${selectedStore.name}` : "Overview"} />
        {myStores.length > 1 && (
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[200px]"><Store className="h-4 w-4 mr-2" /><SelectValue placeholder="Select store" /></SelectTrigger>
            <SelectContent>{myStores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <EnhancedStatCard title="Store Employees" value={totalEmployees} subtitle="Assigned" icon={Users} variant="primary" />
        <EnhancedStatCard title="Present Today" value={presentToday} subtitle={`${Math.round((presentToday / totalEmployees) * 100) || 0}%`} icon={UserCheck} variant="success" />
        <EnhancedStatCard title="On Leave" value={onLeave} subtitle="Today" icon={CalendarX} />
        <EnhancedStatCard title="Pending" value={pendingRequests} subtitle="Requests" icon={Clock} variant={pendingRequests > 0 ? "warning" : "default"} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Store Employees ({totalEmployees})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loadingEmployees ? <div className="p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}</div> : 
           activeEmployees.length === 0 ? <div className="text-center py-8 text-muted-foreground">No employees assigned</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {activeEmployees.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.employee?.first_name} {a.employee?.last_name}</TableCell>
                    <TableCell>{a.employee?.department?.name || "—"}</TableCell>
                    <TableCell><Badge>{a.employee?.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
