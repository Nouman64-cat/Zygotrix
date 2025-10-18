import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/layout/DashboardSidebar";
import DashboardTopBar from "../components/dashboard/layout/DashboardTopBar";

const DashboardLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#03050f] text-white">
      <div className="flex min-h-screen">
        <DashboardSidebar collapsed={collapsed} />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
              <DashboardTopBar
                collapsed={collapsed}
                onToggleSidebar={() => setCollapsed((prev) => !prev)}
                onOpenMobileNav={() => setMobileNavOpen(true)}
              />

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full w-80 max-w-[80%] bg-[#050816]/95 p-4 backdrop-blur">
            <DashboardSidebar mobile onNavigate={() => setMobileNavOpen(false)} />
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
