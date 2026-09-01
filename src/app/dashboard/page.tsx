import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { ProgressDashboard } from "@/components/vim/progress-dashboard";

export const metadata: Metadata = {
  title: "Progress",
  description: "Which Vim commands are in your fingers, and which still need work.",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        <ProgressDashboard />
      </main>
    </div>
  );
}
