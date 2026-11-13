import { SiteHeader } from "./AppShell";
import { Footer } from "@/app/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
