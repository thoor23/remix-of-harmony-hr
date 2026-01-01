import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Email subscription management is not currently available.
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/status">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Status Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
