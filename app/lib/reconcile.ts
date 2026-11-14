import { allDeposits, updateDepositStatus, TERMINAL_STATUSES } from "@/app/lib/deposit-store";
import { fetchOneClickStatus } from "@/app/lib/oneclick-status";
import { log } from "@/app/lib/log";

export interface ReconcileResult {
  checked: number;
  updated: number;
  stillPending: string[];
  failures: string[];
}

/**
 * Keeper restart sweep: reconcile every non-terminal deposit row
 * against the live 1Click status before anything else runs. Terminal rows
 * (SUCCESS / REFUNDED / FAILED / INCOMPLETE_DEPOSIT) are skipped; rows that
 * changed status get their durable record updated.
 */
export async function reconcileDeposits(): Promise<ReconcileResult> {
  // Batch cap: the sweep processes the OLDEST pending rows first; the keeper
  // re-runs it on every boot (and via POST /api/v1/deposits/reconcile).
  const MAX_PER_RUN = Number(process.env.RECONCILE_MAX_PER_RUN || 25);
  const rows = (await allDeposits())
    .filter((r) => r.depositAddress && !TERMINAL_STATUSES.has(r.lastStatus ?? "UNKNOWN"))
    .slice(0, MAX_PER_RUN);
  const result: ReconcileResult = {
    checked: rows.length,
    updated: 0,
    stillPending: [],
    failures: [],
  };

  for (const row of rows) {
    try {
      const { status } = await fetchOneClickStatus(row.depositAddress);
      if (status !== (row.lastStatus ?? "UNKNOWN")) {
        await updateDepositStatus(row.depositAddress, status);
        result.updated += 1;
        log.info("reconcile.updated", {
          deposit: row.depositAddress.slice(0, 10) + "…",
          from: row.lastStatus,
          to: status,
        });
      }
      if (!TERMINAL_STATUSES.has(status)) {
        result.stillPending.push(row.depositAddress);
      }
    } catch (err) {
      result.failures.push(`${row.depositAddress.slice(0, 10)}…: ${String(err).slice(0, 80)}`);
    }
  }

  log.info("reconcile.done", {
    checked: result.checked,
    updated: result.updated,
    pending: result.stillPending.length,
    failures: result.failures.length,
  });
  return result;
}
