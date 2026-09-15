"use client";
import AppSidebar from "@/layout/AppSidebar";
import React from "react";
import { PageHeadingProvider, usePageHeading } from "@/context/PageHeadingContext";

type AdminLayoutProps = {
  children: React.ReactNode;
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { heading } = usePageHeading();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-gray-100 border-r border-gray-200">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">{heading}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <PageHeadingProvider>
      <LayoutContent>{children}</LayoutContent>
    </PageHeadingProvider>
  );
}
