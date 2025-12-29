import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssets, useAssetCategories, useAssetStats } from "@/hooks/useAssets";
import { useLocations } from "@/hooks/useLocations";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, DollarSign, MapPin, Wrench, AlertTriangle, CheckCircle } from "lucide-react";
import { format, addMonths, isAfter, isBefore } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AssetReports() {
  const { data: assets = [] } = useAssets({});
  const { data: categories = [] } = useAssetCategories();
  const { data: locations = [] } = useLocations();
  const { data: stats } = useAssetStats();

  // Category distribution data
  const categoryData = categories.map(cat => ({
    name: cat.name,
    value: assets.filter(a => a.category_id === cat.id).length,
  })).filter(d => d.value > 0);

  // Status distribution data
  const statusData = [
    { name: 'Available', value: assets.filter(a => a.status === 'available').length, color: 'hsl(var(--chart-2))' },
    { name: 'Assigned', value: assets.filter(a => a.status === 'assigned').length, color: 'hsl(var(--primary))' },
    { name: 'Maintenance', value: assets.filter(a => a.status === 'maintenance').length, color: 'hsl(var(--chart-4))' },
    { name: 'Retired', value: assets.filter(a => a.status === 'retired').length, color: 'hsl(var(--chart-5))' },
  ].filter(d => d.value > 0);

  // Location distribution data
  const locationData = locations.map(loc => ({
    name: loc.name,
    assets: assets.filter(a => a.location_id === loc.id).length,
    value: assets.filter(a => a.location_id === loc.id).reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
  })).filter(d => d.assets > 0).slice(0, 10);

  // Condition distribution
  const conditionData = [
    { name: 'New', value: assets.filter(a => a.condition === 'new').length },
    { name: 'Good', value: assets.filter(a => a.condition === 'good').length },
    { name: 'Fair', value: assets.filter(a => a.condition === 'fair').length },
    { name: 'Poor', value: assets.filter(a => a.condition === 'poor').length },
  ].filter(d => d.value > 0);

  // Warranty expiring soon (next 3 months)
  const today = new Date();
  const threeMonthsLater = addMonths(today, 3);
  const warrantyExpiring = assets.filter(a => {
    if (!a.warranty_expiry) return false;
    const expiryDate = new Date(a.warranty_expiry);
    return isAfter(expiryDate, today) && isBefore(expiryDate, threeMonthsLater);
  });

  // Total asset value
  const totalValue = assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);
  const assignedValue = assets.filter(a => a.status === 'assigned').reduce((sum, a) => sum + (a.purchase_cost || 0), 0);

  // Value by category
  const valueByCategoryData = categories.map(cat => ({
    name: cat.name,
    value: assets.filter(a => a.category_id === cat.id).reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  return (
    <PageContainer>
      <PageHeader
        title="Asset Reports"
        description="Analytics and insights for asset management"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{stats?.totalAssets || assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Value</p>
                <p className="text-2xl font-bold">₹{assignedValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiring</p>
                <p className="text-2xl font-bold">{warrantyExpiring.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
            <CardDescription>Breakdown of assets by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
            <CardDescription>Distribution across asset categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
            <CardDescription>Asset count and value per location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'value') return [`₹${Number(value).toLocaleString()}`, 'Value'];
                      return [value, 'Assets'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="assets" fill="hsl(var(--primary))" name="Assets" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Value by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Value by Category</CardTitle>
            <CardDescription>Total value distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueByCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Condition & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Condition</CardTitle>
            <CardDescription>Current condition of all assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Warranty Expiring Soon
            </CardTitle>
            <CardDescription>Assets with warranty expiring in next 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            {warrantyExpiring.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assets with warranty expiring soon
              </div>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto">
                {warrantyExpiring.slice(0, 10).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">{asset.asset_tag}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">
                        {format(new Date(asset.warranty_expiry!), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
                {warrantyExpiring.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{warrantyExpiring.length - 10} more assets
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
