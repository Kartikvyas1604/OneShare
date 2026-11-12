import { Hero } from "@/app/components/landing/Hero";
import { TickerStrip } from "@/app/components/landing/TickerStrip";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { Features } from "@/app/components/landing/Features";
import { NftShowcase } from "@/app/components/landing/NftShowcase";
import { StatsBand } from "@/app/components/landing/StatsBand";
import { FinalCta } from "@/app/components/landing/FinalCta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TickerStrip />
      <HowItWorks />
      <Features />
      <StatsBand />
      <NftShowcase />
      <FinalCta />
    </>
  );
}
