// Structured logging + error capture (Sentry-ready). Emits JSON lines so they
// parse cleanly in any log aggregator. captureError is a no-op without a DSN.
export type Level = "debug" | "info" | "warn" | "error";

export interface LogEntry { level: Level; msg: string; ts: string; [k: string]: unknown; }

export function log(level: Level, msg: string, meta: Record<string, unknown> = {}): LogEntry {
  const entry: LogEntry = { level, msg, ts: new Date().toISOString(), ...meta };
  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(JSON.stringify(entry));
  return entry;
}

export function captureError(err: unknown, ctx: Record<string, unknown> = {}): void {
  const message = err instanceof Error ? err.message : String(err);
  log("error", message, { ...ctx, stack: err instanceof Error ? err.stack : undefined });
  // If process.env.SENTRY_DSN is set, forward here (left as an integration hook).
}

export async function withTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const out = await fn();
    log("info", "op.complete", { op: name, ms: Date.now() - start });
    return out;
  } catch (e) {
    log("warn", "op.failed", { op: name, ms: Date.now() - start });
    throw e;
  }
}
