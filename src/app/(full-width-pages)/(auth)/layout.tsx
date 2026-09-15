import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import { ChevronLast, ChevronsLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 py-0 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          <GridShape />
          <GridShape />
          <GridShape />
          <GridShape />
          <GridShape />
          {children}
          <div className="lg:w-1/2 w-full h-full dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Image
                  width={600}
                  height={600}
                  src="https://pinevoxglobalbucket.s3.eu-west-2.amazonaws.com/hexa-consultancy/hexa-color-logo.png"
                  alt="Logo"
                />
              </div>

            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
