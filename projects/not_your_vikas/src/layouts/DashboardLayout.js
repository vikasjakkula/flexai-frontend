import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";


function DashboardLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;


