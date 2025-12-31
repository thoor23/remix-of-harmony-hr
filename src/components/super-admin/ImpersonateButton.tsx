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
import { api } from "@/lib/api";
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
      const response = await api.post<{ token: string; redirect_url: string }>(
        `/super-admin/companies/${companyId}/impersonate`
      );
      return response;
    },
    onSuccess: (data) => {
      toast.success("Impersonation token generated");
      // Open the company's dashboard in a new tab with the impersonation token
      const url = data.redirect_url || `/app/dashboard?impersonate=${data.token}`;
      window.open(url, "_blank");
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
