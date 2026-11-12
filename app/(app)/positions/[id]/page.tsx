import { redirect } from "next/navigation";

/** Position detail moved to `/vault/[id]` (Agent.md §6.5); the id passes through. */
export default async function PositionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/vault/${id}`);
}
