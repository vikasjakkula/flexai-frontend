import { NavLink } from "react-router-dom";

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/predict", label: "Predict" },
  { to: "/diet", label: "Diet" },
];

const Navbar = () => (
  <nav className="global-navbar">
    <span className="navbar-brand" style={{ fontWeight: "bold", fontSize: "1.15rem", marginRight: "2rem", letterSpacing: "0.03em" }}>RPM</span>
    <ul className="nav-links">
      {navLinks.map(({ to, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link--active" : ""}`
            }
          >
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
    <span className="nav-end" aria-hidden="true">
      &nbsp;
    </span>
  </nav>
);

export default Navbar;
