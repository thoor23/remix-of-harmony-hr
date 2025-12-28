import api from "@/lib/api";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

interface AdminEmployee {
  id: string;
  user_id: string;
}

interface Employee {
  id: string;
  user_id: string;
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
  try {
    await api.post("/notifications", {
      user_id: userId,
      title,
      message,
      type,
      link,
    });
  } catch (error) {
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
  try {
    // Get admin/HR employees
    const employees = await api.get<AdminEmployee[]>("/employees?role=admin,hr");

    if (!employees || employees.length === 0) {
      console.log("No admin users found to notify");
      return;
    }

    console.log("Creating notifications for admin users:", employees.map(e => e.user_id));

    // Create notifications for all admins
    const notifications = employees
      .filter(e => e.user_id)
      .map((employee) => ({
        user_id: employee.user_id,
        title,
        message,
        type,
        link,
      }));

    // Send all notifications
    await Promise.all(
      notifications.map((notification) =>
        api.post("/notifications", notification).catch((err) => {
          console.error("Failed to create notification:", err);
        })
      )
    );

    console.log("Admin notifications created successfully");
  } catch (err) {
    console.error("Error in notifyAdmins:", err);
  }
}

/**
 * Get the user_id for an employee
 */
export async function getEmployeeUserId(employeeId: string): Promise<string | null> {
  try {
    const employee = await api.get<Employee>(`/employees/${employeeId}`);

    if (!employee?.user_id) {
      console.error("Employee user_id not found");
      return null;
    }

    return employee.user_id;
  } catch (error) {
    console.error("Failed to get employee user_id:", error);
    return null;
  }
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
