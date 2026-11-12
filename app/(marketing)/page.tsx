import { Hero } from "@/app/components/landing/Hero";
import { TickerStrip } from "@/app/components/landing/TickerStrip";
import { WhatItDoes } from "@/app/components/landing/WhatItDoes";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { WhyFloorline } from "@/app/components/landing/WhyFloorline";
import { LossLimitPreview } from "@/app/components/landing/LossLimitPreview";
import { StatsBand } from "@/app/components/landing/StatsBand";
import { DemoVideo } from "@/app/components/landing/DemoVideo";
import { Faq } from "@/app/components/landing/Faq";
import { FinalCta } from "@/app/components/landing/FinalCta";
import { WordmarkMarquee } from "@/app/components/landing/WordmarkMarquee";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TickerStrip />
      <WhatItDoes />
      <HowItWorks />
      <WhyFloorline />
      <LossLimitPreview />
      <StatsBand />
      <DemoVideo />
      <Faq />
      <FinalCta />
      <WordmarkMarquee />
      <LandingFooter />
    </>
  );
}
