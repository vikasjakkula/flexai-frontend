"use client";

import Link from "next/link";
import "./globals.css";
import LiquidEther from "./LiquidEther";
import SplashCursor from "../components/SplashCursor";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* LiquidEther background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <LiquidEther className="w-full h-full" />
      </div>
      {/* SplashCursor overlay */}
      <div className="fixed inset-0 pointer-events-none z-20">
        <SplashCursor />
      </div>
      {/* Main content */}
      <div className="flex flex-col items-center gap-8 z-10 relative">
        <h1 className="text-4xl font-raleway mb-6">Welcome</h1>
        <div className="flex flex-col gap-4 w-48">
          <Link href="/Pricing" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Pricing</button>
          </Link>
          <Link href="/Docs" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Docs</button>
          </Link>
          <Link href="/Blog" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Blog</button>
          </Link>
          <Link href="/About" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">About</button>
          </Link>
          <Link href="/Contact" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Contact</button>
          </Link>
          <Link href="/Login" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Login</button>
          </Link>
          <Link href="/Signup" passHref>
            <button className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Sign Up</button>
          </Link>
        </div>
        <h1>Please wait for a second after Clicking the buttons above!</h1>
      </div>
    </div>
  );
}