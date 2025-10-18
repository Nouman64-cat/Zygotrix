import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import DashboardSidebar from "../components/dashboard/layout/DashboardSidebar";
import DashboardTopBar from "../components/dashboard/layout/DashboardTopBar";

const DashboardLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#03050f] text-white">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        <div className="flex-1 space-y-6">
          <div className="lg:hidden">
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              aria-label="Toggle navigation"
            >
              <FiMenu />
            </button>
            {mobileNavOpen && (
              <div className="mb-6" onClick={() => setMobileNavOpen(false)}>
                <DashboardSidebar mobile />
              </div>
            )}
          </div>

          <DashboardTopBar />

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
