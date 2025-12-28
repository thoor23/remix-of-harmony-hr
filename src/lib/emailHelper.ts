import api from "@/lib/api";

export type EmailNotificationType = 
  | "leave_request_new" 
  | "leave_approved" 
  | "leave_rejected" 
  | "ticket_new" 
  | "ticket_resolved" 
  | "attendance_late"
  | "payslip_generated" 
  | "announcement_new" 
  | "welcome_employee";

interface SendNotificationEmailParams {
  type: EmailNotificationType;
  recipientEmail: string;
  recipientName: string;
  data: Record<string, string | number | undefined>;
}

interface AdminEmployee {
  id: string;
  user_id: string;
  profile?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface EmployeeWithProfile {
  id: string;
  user_id: string;
  profile?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Send a notification email using the configured email provider
 * This function calls the backend email endpoint
 */
export async function sendNotificationEmail({
  type,
  recipientEmail,
  recipientName,
  data,
}: SendNotificationEmailParams): Promise<boolean> {
  try {
    const result = await api.post<{ success: boolean; error?: string }>("/email/send", {
      type,
      recipientEmail,
      recipientName,
      data,
    });

    if (!result?.success) {
      console.error("Email sending failed:", result?.error);
      return false;
    }

    console.log("Notification email sent successfully:", type);
    return true;
  } catch (err) {
    console.error("Error sending notification email:", err);
    return false;
  }
}

/**
 * Send leave status email to employee
 */
export async function sendLeaveStatusEmail(params: {
  recipientEmail: string;
  recipientName: string;
  status: "approved" | "rejected";
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  approvedBy?: string;
  comments?: string;
}): Promise<boolean> {
  const type = params.status === "approved" ? "leave_approved" : "leave_rejected";
  
  return sendNotificationEmail({
    type,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    data: {
      leave_type: params.leaveType,
      start_date: params.startDate,
      end_date: params.endDate,
      days: params.days,
      approved_by: params.approvedBy || "HR",
      comments: params.comments || "",
      status: params.status,
    },
  });
}

/**
 * Send new leave request email to admins
 */
export async function sendLeaveRequestEmail(params: {
  adminEmails: string[];
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}): Promise<boolean> {
  // Send to each admin
  const results = await Promise.all(
    params.adminEmails.map((email) =>
      sendNotificationEmail({
        type: "leave_request_new",
        recipientEmail: email,
        recipientName: "Admin",
        data: {
          employee_name: params.employeeName,
          leave_type: params.leaveType,
          start_date: params.startDate,
          end_date: params.endDate,
          days: params.days,
          reason: params.reason || "Not specified",
        },
      })
    )
  );

  return results.some((r) => r);
}

/**
 * Send new ticket email to admins
 */
export async function sendNewTicketEmail(params: {
  adminEmails: string[];
  employeeName: string;
  ticketSubject: string;
  ticketCategory: string;
  ticketPriority: string;
  ticketDescription?: string;
}): Promise<boolean> {
  const priorityColors: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    urgent: "#dc2626",
  };

  const results = await Promise.all(
    params.adminEmails.map((email) =>
      sendNotificationEmail({
        type: "ticket_new",
        recipientEmail: email,
        recipientName: "Admin",
        data: {
          employee_name: params.employeeName,
          ticket_subject: params.ticketSubject,
          ticket_category: params.ticketCategory,
          ticket_priority: params.ticketPriority,
          ticket_description: params.ticketDescription || "",
          priority_color: priorityColors[params.ticketPriority] || "#6b7280",
        },
      })
    )
  );

  return results.some((r) => r);
}

/**
 * Send ticket resolved email to employee
 */
export async function sendTicketResolvedEmail(params: {
  recipientEmail: string;
  recipientName: string;
  ticketSubject: string;
  ticketCategory: string;
}): Promise<boolean> {
  return sendNotificationEmail({
    type: "ticket_resolved",
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    data: {
      ticket_subject: params.ticketSubject,
      ticket_category: params.ticketCategory,
    },
  });
}

/**
 * Send payslip generated email to employee
 */
export async function sendPayslipEmail(params: {
  recipientEmail: string;
  recipientName: string;
  payPeriod: string;
  payDate: string;
  netPay: string;
}): Promise<boolean> {
  return sendNotificationEmail({
    type: "payslip_generated",
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    data: {
      pay_period: params.payPeriod,
      pay_date: params.payDate,
      net_pay: params.netPay,
    },
  });
}

/**
 * Send welcome email to new employee
 */
export async function sendWelcomeEmail(params: {
  recipientEmail: string;
  recipientName: string;
  tempPassword: string;
}): Promise<boolean> {
  return sendNotificationEmail({
    type: "welcome_employee",
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    data: {
      temp_password: params.tempPassword,
    },
  });
}

/**
 * Get admin emails for sending notifications
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    // Get admin employees with their profiles
    const employees = await api.get<AdminEmployee[]>("/employees?role=admin,hr");
    
    if (!employees || employees.length === 0) {
      console.log("No admin users found");
      return [];
    }

    // Extract emails from profiles
    const emails = employees
      .filter((e) => e.profile?.email)
      .map((e) => e.profile!.email);

    return emails;
  } catch (err) {
    console.error("Error getting admin emails:", err);
    return [];
  }
}

/**
 * Get employee email by employee ID
 */
export async function getEmployeeEmail(employeeId: string): Promise<{ email: string; name: string } | null> {
  try {
    const employee = await api.get<EmployeeWithProfile>(`/employees/${employeeId}`);

    if (!employee?.profile?.email) {
      console.error("Employee profile or email not found");
      return null;
    }

    const name = [employee.profile.first_name, employee.profile.last_name].filter(Boolean).join(" ") || "Employee";
    return { email: employee.profile.email, name };
  } catch (err) {
    console.error("Error getting employee email:", err);
    return null;
  }
}
