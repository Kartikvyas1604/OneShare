import { redirect } from "next/navigation";

/** `/sim` moved to `/crash` — the demo page (Agent.md §6.5). */
export default function SimPage() {
  redirect("/crash");
}
