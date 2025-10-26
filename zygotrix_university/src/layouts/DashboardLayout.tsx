import { Outlet, useLocation } from "react-router-dom";
import DashboardTopNav from "../components/dashboard/layout/DashboardTopNav";

const DashboardLayout = () => {
  const location = useLocation();
  const isCourseWorkspace =
    location.pathname.includes("/university/courses/") &&
    !location.pathname.endsWith("/university/courses");

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Fixed Top Navigation */}
        <div className="flex-shrink-0">
          <DashboardTopNav />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden">
          {isCourseWorkspace ? (
            <Outlet />
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-8xl px-4 sm:px-8 py-6">
                <div className="rounded-[1.75rem] border border-border bg-surface p-6 transition-colors mb-8">
                  <Outlet />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
