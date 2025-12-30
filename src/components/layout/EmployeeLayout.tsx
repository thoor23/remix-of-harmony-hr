import { useState } from "react";
import { Outlet } from "react-router-dom";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { TopBar } from "./TopBar";

export function EmployeeLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <EmployeeSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 min-h-0 overflow-auto scrollbar-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}