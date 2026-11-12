import { Suspense } from "react";
import { AppSidebar, MobileDock, MobileHeader } from "./AppShell";
import { Footer } from "@/app/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full md:pl-60">
      <Suspense
        fallback={<aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-background md:block" />}
      >
        <AppSidebar />
      </Suspense>
      <Suspense fallback={<div className="sticky top-0 z-40 h-14 border-b border-border md:hidden" />}>
        <MobileHeader />
      </Suspense>

      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-8">
          {children}
        </div>
      </main>

      <Footer />

      <Suspense fallback={<nav className="fixed bottom-0 hidden" />}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
