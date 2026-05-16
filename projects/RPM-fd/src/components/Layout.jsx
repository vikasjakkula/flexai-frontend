import React, { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

const Layout = () => {
  const [globalLoading, setGlobalLoading] = useState(false);

  // useNavigation() only works with createBrowserRouter; we use BrowserRouter, so only globalLoading here
  const showLoader = globalLoading;

  return (
    <LoadingContext.Provider value={{ setGlobalLoading }}>
      <Navbar />

      {showLoader && (
        <div className="page-loader">
          <div className="loader-ring"></div>
          <p className="text-blue-600 font-medium animate-pulse">Syncing Vitals...</p>
        </div>
      )}

      <main className={`main-outlet ${showLoader ? "opacity-20 pointer-events-none transition-opacity duration-300" : "opacity-100 transition-opacity duration-500"}`}>
        <Outlet />
      </main>
    </LoadingContext.Provider>
  );
};

export default Layout;
