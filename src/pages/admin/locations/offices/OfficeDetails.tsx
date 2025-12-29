import { useParams, Link } from "react-router-dom";
import { Building2, MapPin, Phone, Mail, Globe, Calendar, DollarSign, ArrowLeft, Edit } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation as useLocationData } from "@/hooks/useLocations";

export default function OfficeDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: office, isLoading } = useLocationData(id || "");

  if (isLoading) return <PageContainer><PageHeader title="Office Details" /><Skeleton className="h-64 w-full" /></PageContainer>;
  if (!office) return <PageContainer><PageHeader title="Office Not Found" /><Button asChild><Link to="/admin/locations/offices">Back</Link></Button></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title={office.name} description={`Office Code: ${office.code}`}>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/admin/locations/offices"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
          <Button asChild><Link to={`/admin/locations/offices/${id}/edit`}><Edit className="h-4 w-4 mr-2" />Edit</Link></Button>
        </div>
      </PageHeader>
      <Card>
        <CardHeader><div className="flex justify-between"><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Office Information</CardTitle><Badge variant={office.is_active ? "default" : "secondary"}>{office.is_active ? "Active" : "Inactive"}</Badge></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Address</p><p className="text-muted-foreground">{[office.address_street, office.address_city, office.address_country].filter(Boolean).join(", ") || "Not specified"}</p></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Phone</p><p className="text-muted-foreground">{office.phone || "Not specified"}</p></div></div>
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Email</p><p className="text-muted-foreground">{office.email || "Not specified"}</p></div></div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Timezone</p><p className="text-muted-foreground text-sm">{office.timezone || "Asia/Kolkata"}</p></div></div>
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Date Format</p><p className="text-muted-foreground text-sm">{office.date_format || "DD/MM/YYYY"}</p></div></div>
            <div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Currency</p><p className="text-muted-foreground text-sm">{office.currency || "INR"}</p></div></div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
