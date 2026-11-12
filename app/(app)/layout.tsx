import { Suspense } from "react";
import { NavBar } from "./NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Suspense fallback={<header className="sticky top-0 z-40 h-14 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl" />}>
        <NavBar />
      </Suspense>

      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 pb-28 pt-5 md:max-w-2xl md:pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
