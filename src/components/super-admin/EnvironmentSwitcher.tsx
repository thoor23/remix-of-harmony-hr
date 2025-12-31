import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cloud, Server } from "lucide-react";
import {
  getActiveEnvironment,
  setActiveEnvironment,
  type SupabaseEnvironment,
} from "@/integrations/supabase/env-switcher";

export function EnvironmentSwitcher() {
  const currentEnv = getActiveEnvironment();
  const [pendingEnv, setPendingEnv] = useState<SupabaseEnvironment | null>(null);

  const handleEnvChange = (value: SupabaseEnvironment) => {
    if (value !== currentEnv) {
      setPendingEnv(value);
    }
  };

  const confirmSwitch = () => {
    if (pendingEnv) {
      setActiveEnvironment(pendingEnv);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`${
            currentEnv === "cloud"
              ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
              : "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950"
          }`}
        >
          {currentEnv === "cloud" ? (
            <Cloud className="h-3 w-3 mr-1" />
          ) : (
            <Server className="h-3 w-3 mr-1" />
          )}
          {currentEnv === "cloud" ? "Cloud" : "VPS"}
        </Badge>

        <Select value={currentEnv} onValueChange={handleEnvChange}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cloud">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-green-500" />
                <span>Lovable Cloud</span>
              </div>
            </SelectItem>
            <SelectItem value="vps">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-orange-500" />
                <span>VPS Testing</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={!!pendingEnv} onOpenChange={() => setPendingEnv(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Environment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEnv === "vps" ? (
                <>
                  You are about to switch to <strong>VPS Testing</strong>{" "}
                  environment. This will connect to your self-hosted Supabase
                  instance at <code>hrms.thorodin.online</code>.
                  <br />
                  <br />
                  <span className="text-orange-600 dark:text-orange-400">
                    ⚠️ Warning: Make sure your VPS database has the correct
                    schema before switching.
                  </span>
                </>
              ) : (
                <>
                  You are about to switch back to{" "}
                  <strong>Lovable Cloud (Production)</strong> environment.
                </>
              )}
              <br />
              <br />
              The page will reload to apply changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>
              Switch Environment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
