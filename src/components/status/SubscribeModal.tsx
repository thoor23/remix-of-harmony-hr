import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeModal({ open, onOpenChange }: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // Generate a unique token for unsubscribe
      const verificationToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from("status_subscribers")
        .insert({
          email: email.toLowerCase().trim(),
          verification_token: verificationToken,
          is_verified: true, // Auto-verify for simplicity
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already subscribed");
        } else {
          throw error;
        }
        return;
      }

      setIsSubscribed(true);
      toast.success("Successfully subscribed to status updates!");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after modal closes
    setTimeout(() => {
      setEmail("");
      setIsSubscribed(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        {isSubscribed ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You're subscribed!</h3>
            <p className="text-zinc-400 mb-6">
              You'll receive email updates when service status changes.
            </p>
            <Button
              onClick={handleClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-zinc-400" />
                </div>
                <DialogTitle className="text-xl">Subscribe to updates</DialogTitle>
              </div>
              <DialogDescription className="text-zinc-400">
                Get notified via email when service status changes. We'll only send important updates.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubscribe} className="mt-4 space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                You can unsubscribe at any time via the link in our emails.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
