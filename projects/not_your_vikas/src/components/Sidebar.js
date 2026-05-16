import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Dashboard</h2>
      <nav>
        <NavLink to="/dashboard/home">Home</NavLink>
        <NavLink to="/dashboard/users">Users</NavLink>
        <NavLink to="/dashboard/products">Products</NavLink>
        <NavLink to="/dashboard/orders">Orders</NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
