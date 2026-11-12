import { redirect } from "next/navigation";

/** `/buy` moved to `/create` — the loss-limit flow (Agent.md §6.5). */
export default function BuyPage() {
  redirect("/create");
}
