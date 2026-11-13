import type { Metadata } from "next";
import { LandingNavbar } from "@/app/components/landing/LandingNavbar";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Legal — Floorline",
  description:
    "Terms of service and privacy policy for Floorline: self-managing tokenized-equity positions on NEAR.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <>
      <LandingNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-16 md:py-24">
          <header>
            <p className="eyebrow">Legal</p>
            <h1 className="display mt-2 text-4xl text-foreground">Terms &amp; Privacy</h1>
            <p className="num mt-3 text-xs text-muted-foreground">
              Version 1 · effective 13 Nov 2026 · template drafted for review by qualified counsel
              before market launch
            </p>
          </header>

          <Section title="Terms of Service">
            <p>
              Floorline is a self-custodial interface for creating and managing tokenized-equity
              positions on NEAR. By using this interface you confirm that you are not a resident of
              or located in the United States, and that tokenized equities are not offered or
              marketed to you.
            </p>
            <p>
              <strong>No investment advice.</strong> Nothing on this site is investment, legal, tax,
              or accounting advice. Loss limits, reserves, and de-risk rules are mechanisms of the
              protocol, not guarantees of performance. You can lose money — up to the risk budget
              you chose at deposit.
            </p>
            <p>
              <strong>Smart-contract risk.</strong> Positions are governed by the Floorline vault
              and escrow contracts on NEAR. The contracts have not been audited by a third party at
              the time of this build; the invariant suite and its deliberately broken counterpart
              are published in the repository. Bug reports and disclosures: open an issue on the
              public repository (responsible disclosure honoured, credit given).
            </p>
            <p>
              <strong>Third-party rails.</strong> Deposits route through NEAR Intents (1Click).
              Their terms, fees, and solvency are independent of Floorline; read them before
              sending funds. Oracle prices come from the 1Click price feed and secondary sources
              with a 3% disagreement bound and a 60-second staleness limit.
            </p>
            <p>
              <strong>Fees.</strong> Management and performance fees are set to 0% for the current
              build. Early exit pays NAV minus a 1% protocol fee. 1Click charges its own spread and
              an unauthenticated 0.25% fee until the partner key is configured.
            </p>
          </Section>

          <Section title="Privacy Policy">
            <p>
              <strong>What we store.</strong> The interface stores your in-flight deposit tracking
              records: the 1Click deposit address, amount, destination asset, and timestamps. No
              name, email, or identity is collected; no cookies are set for tracking; nothing is
              sold. Your connected wallet is read from your own injected wallet in your browser and
              is not persisted by us.
            </p>
            <p>
              <strong>What third parties see.</strong> Price, quote, and deposit-address requests
              go to the 1Click API; transaction history comes from the nearblocks indexer; position
              reads go to a NEAR JSON-RPC node. Those services see your IP address and request
              metadata as with any web service.
            </p>
            <p>
              <strong>Deletion.</strong> Deposit tracking records are pruned automatically 30 days
              after creation. To request earlier deletion of any record tied to your addresses,
              open an issue on the public repository — deletion is executed on the next store write.
            </p>
            <p>
              <strong>On-chain data is public.</strong> Positions, balances, and transfers on NEAR
              are public by design and cannot be deleted by us.
            </p>
          </Section>

          <p className="text-[11px] leading-relaxed text-faint">
            This document is a starting-point template, not legal advice. Before public launch with
            real deposits, have qualified counsel review it for the jurisdictions you serve
            (regulatory exposure is the largest open risk — T-08 in the build spec).
          </p>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
