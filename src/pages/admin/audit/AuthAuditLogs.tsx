import AuditLogsPage from "./AuditLogsPage";

export default function AuthAuditLogs() {
  return (
    <AuditLogsPage
      module="Auth"
      title="Authentication Audit Logs"
      description="Track all login, logout and authentication activities"
    />
  );
}
