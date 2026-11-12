import { LandingNavbar } from "@/app/components/landing/LandingNavbar";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
