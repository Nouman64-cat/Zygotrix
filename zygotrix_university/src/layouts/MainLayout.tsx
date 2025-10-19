import { Outlet } from "react-router-dom";
import NavigationBar from "../components/navigation/NavigationBar";
import SiteFooter from "../components/layout/SiteFooter";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="relative isolate">
        <div className="fixed inset-0 -z-30">
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-3xl" />
        </div>
        <NavigationBar />
        <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
};

export default MainLayout;
