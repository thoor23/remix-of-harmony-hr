import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, Loader2, ExternalLink } from "lucide-react";

interface ImpersonateButtonProps {
  companyId: string;
  companyName: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function ImpersonateButton({
  companyId,
  companyName,
  variant = "outline",
}: ImpersonateButtonProps) {
  const [open, setOpen] = useState(false);

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      // Generate a temporary impersonation token
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
      
      // Get the first admin user of the target company
      const { data: companyAdmin } = await supabase
        .from('user_roles')
        .select('user_id, employees!inner(company_id)')
        .eq('role', 'admin')
        .eq('employees.company_id', companyId)
        .limit(1)
        .maybeSingle();
      
      if (!companyAdmin?.user_id) {
        throw new Error("No admin user found for this company");
      }
      
      // Store the impersonation token
      const { error } = await supabase
        .from('impersonation_tokens')
        .insert({
          token,
          super_admin_id: user.id,
          target_user_id: companyAdmin.user_id,
          company_id: companyId,
          expires_at: expiresAt,
        } as any);
      
      if (error) throw error;
      
      return { token, redirect_url: `/app/dashboard?impersonate=${token}` };
    },
    onSuccess: (data) => {
      toast.success("Impersonation token generated");
      window.open(data.redirect_url, "_blank");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate impersonation token");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant}>
          <LogIn className="h-4 w-4 mr-2" />
          Login as Admin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login as Company Admin</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to login as an admin of <strong>{companyName}</strong>.
            This action will be logged for security purposes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
          <p>
            <strong>Note:</strong> You will be redirected to the company's
            dashboard in a new tab. Your actions will be visible in audit logs.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => impersonateMutation.mutate()}
            disabled={impersonateMutation.isPending}
          >
            {impersonateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
