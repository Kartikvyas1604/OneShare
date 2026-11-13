/**
 * Structured JSON logging with correlation ids — machine-parsable so a log
 * aggregator (or `docker logs | jq`) can alert on error rates without regex.
 */

export type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

let seq = 0;

function emit(level: LogLevel, event: string, fields: LogFields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    requestId: (fields.requestId as string | undefined) ?? `req_${Date.now().toString(36)}_${(seq++).toString(36)}`,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};

/** Extract a correlation id from a request (client-supplied or generated). */
export function requestIdOf(request: Request): string {
  return (
    request.headers.get("x-request-id") ??
    `req_${Date.now().toString(36)}_${(seq++).toString(36)}`
  );
}
