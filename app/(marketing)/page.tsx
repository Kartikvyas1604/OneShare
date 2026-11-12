import { Hero } from "@/app/components/landing/Hero";
import { TickerStrip } from "@/app/components/landing/TickerStrip";
import { LossLimitPreview } from "@/app/components/landing/LossLimitPreview";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { Features } from "@/app/components/landing/Features";
import { StatsBand } from "@/app/components/landing/StatsBand";
import { DemoVideo } from "@/app/components/landing/DemoVideo";
import { NftShowcase } from "@/app/components/landing/NftShowcase";
import { FinalCta } from "@/app/components/landing/FinalCta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TickerStrip />
      <LossLimitPreview />
      <HowItWorks />
      <Features />
      <StatsBand />
      <DemoVideo />
      <NftShowcase />
      <FinalCta />
    </>
  );
}
