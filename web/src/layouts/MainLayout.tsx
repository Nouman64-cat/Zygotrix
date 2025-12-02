import React from "react";
import { Outlet } from "react-router-dom";

import Footer from "../components/universal/Footer";
import Navbar from "../components/universal/Navbar";

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative z-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
