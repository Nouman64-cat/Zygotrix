import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/layout/DashboardSidebar";
import DashboardTopBar from "../components/dashboard/layout/DashboardTopBar";

const DashboardLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar collapsed={collapsed} />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0 bg-background px-4 sm:px-8 pt-8 pb-6 border-b border-border">
            <div className="mx-auto max-w-8xl">
              <DashboardTopBar
                collapsed={collapsed}
                onToggleSidebar={() => setCollapsed((prev) => !prev)}
                onOpenMobileNav={() => setMobileNavOpen(true)}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-8xl px-4 sm:px-8 py-6">
              <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors mb-8">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full w-80 max-w-[80%] bg-overlay p-4 backdrop-blur transition-colors">
            <DashboardSidebar
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
          <button
            type="button"
            className="flex-1 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
