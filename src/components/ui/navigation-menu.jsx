"use client";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const navigationMenuTriggerStyle = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-accent/50 px-4 py-2"
);

const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
  <nav ref={ref} className={cn("relative z-50 flex w-full", className)} {...props}>
    {children}
  </nav>
));
NavigationMenu.displayName = "NavigationMenu";

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row gap-2", className)} {...props} />
));
NavigationMenuList.displayName = "NavigationMenuList";

const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("relative", className)} {...props} />
));
NavigationMenuItem.displayName = "NavigationMenuItem";

const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <button ref={ref} className={cn(navigationMenuTriggerStyle(), className)} {...props}>
    {children}
  </button>
));
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("absolute left-0 top-full mt-2 min-w-[200px] rounded-md bg-white shadow-lg border border-gray-200", className)} {...props} />
));
NavigationMenuContent.displayName = "NavigationMenuContent";

const NavigationMenuLink = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "a";
  return (
    <Comp ref={ref} className={cn("block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors", className)} {...props} />
  );
});
NavigationMenuLink.displayName = "NavigationMenuLink";

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
}; 