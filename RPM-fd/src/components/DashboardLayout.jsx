import { Outlet } from "react-router-dom";

/**
 * Second-level layout: wraps Dashboard (and future dashboard sub-routes)
 * with its own Outlet so nested routes render here.
 */
const DashboardLayout = () => (
  <div className="dashboard-layout">
    <Outlet />
  </div>
);

export default DashboardLayout;
