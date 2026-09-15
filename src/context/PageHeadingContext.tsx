"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

type PageHeadingContextType = {
  heading: string;
  setHeading: (heading: string) => void;
};

const PageHeadingContext = createContext<PageHeadingContextType | undefined>(undefined);

export const PageHeadingProvider = ({ children }: { children: ReactNode }) => {
  const [heading, setHeading] = useState("Welcome!");
  const pathname = usePathname();

  useEffect(() => {
    // Reset to default heading on route change
    setHeading("Welcome!");
  }, [pathname]);

  return (
    <PageHeadingContext.Provider value={{ heading, setHeading }}>
      {children}
    </PageHeadingContext.Provider>
  );
};

export const usePageHeading = () => {
  const context = useContext(PageHeadingContext);
  if (!context) {
    throw new Error("usePageHeading must be used within a PageHeadingProvider");
  }
  return context;
};
