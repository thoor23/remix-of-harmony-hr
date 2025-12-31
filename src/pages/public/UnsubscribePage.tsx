import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail, MailX } from "lucide-react";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("invalid");
      setMessage("Invalid unsubscribe link. No token provided.");
      return;
    }

    const unsubscribe = async () => {
      try {
        // Find the subscriber by token
        const { data: subscriber, error: fetchError } = await supabase
          .from("status_subscribers")
          .select("id, email, unsubscribed_at")
          .eq("verification_token", token)
          .single();

        if (fetchError || !subscriber) {
          setStatus("error");
          setMessage("This unsubscribe link is invalid or has expired.");
          return;
        }

        if (subscriber.unsubscribed_at) {
          setStatus("success");
          setMessage("You have already been unsubscribed from status updates.");
          return;
        }

        // Mark as unsubscribed
        const { error: updateError } = await supabase
          .from("status_subscribers")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("verification_token", token);

        if (updateError) {
          throw updateError;
        }

        setStatus("success");
        setMessage(`Successfully unsubscribed ${subscriber.email} from status updates.`);
      } catch (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
        setMessage("An error occurred while processing your request. Please try again.");
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {status === "success" && (
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            )}
            {(status === "error" || status === "invalid") && (
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "loading" && "Processing..."}
            {status === "success" && "Unsubscribed"}
            {status === "error" && "Error"}
            {status === "invalid" && "Invalid Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">{message}</p>
          
          {status === "success" && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MailX className="h-4 w-4" />
                <span>You will no longer receive status update emails</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/status">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Status Page
              </Link>
            </Button>
            {status === "success" && (
              <Button variant="ghost" asChild>
                <Link to="/status">
                  <Mail className="mr-2 h-4 w-4" />
                  Resubscribe
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
