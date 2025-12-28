import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  link,
}: CreateNotificationParams): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify all admin and HR users
 */
export async function notifyAdmins(
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
): Promise<void> {
  // Get all admin and HR user IDs
  const { data: adminRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "hr"]);

  if (rolesError) {
    console.error("Failed to fetch admin users:", rolesError);
    return;
  }

  if (!adminRoles || adminRoles.length === 0) return;

  // Create notifications for all admins
  const notifications = adminRoles.map((role) => ({
    user_id: role.user_id,
    title,
    message,
    type,
    link,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Failed to create admin notifications:", error);
  }
}

/**
 * Get the user_id for an employee
 */
export async function getEmployeeUserId(employeeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("user_id")
    .eq("id", employeeId)
    .single();

  if (error || !data?.user_id) {
    console.error("Failed to get employee user_id:", error);
    return null;
  }

  return data.user_id;
}

/**
 * Notify an employee by their employee ID
 */
export async function notifyEmployee(
  employeeId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
): Promise<void> {
  const userId = await getEmployeeUserId(employeeId);
  
  if (!userId) return;

  await createNotification({
    userId,
    title,
    message,
    type,
    link,
  });
}
