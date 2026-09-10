import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import { Sidebar } from "./components/Sidebar";

export default async function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const profile = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <Sidebar profile={profile} />
      <div className="lg:pl-64">
        <header className="lg:hidden h-14" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}