import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";

export type NeonResult<R = Record<string, unknown>> = {
  rows: R[];
  rowCount: number | null;
  command: string;
};
export type NeonError = Error & { status?: number; code?: string; neonMessage?: string };

const SERVICE_ERROR =
  "Service momentanÃ©ment indisponible, rÃ©essaie ou contacte-nous sur WhatsApp";
let cachedUrl = "";
let cachedSql: ReturnType<typeof neon> | undefined;

function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("Configuration serveur manquante : DATABASE_URL doit Ãªtre dÃ©finie.");
  if (cachedSql && cachedUrl === url) return cachedSql;
  cachedUrl = url;
  cachedSql = neon(url);
  return cachedSql;
}

function commandOf(query: string): string {
  return (
    query
      .trim()
      .match(
        /^(select|insert|update|delete|with|create|alter|drop|truncate|call|set|begin|commit|rollback)/i,
      )?.[1]
      ?.toUpperCase() ?? "UNKNOWN"
  );
}

function normalizeError(error: unknown): NeonError {
  const source = error instanceof Error ? error : new Error(SERVICE_ERROR);
  const originalMessage = source.message;

  console.error("[NEON DEBUG]", {
    message: originalMessage,
    name: source.name,
    code: (source as NeonError).code,
    status: (source as NeonError).status,
  });

  const e = source as NeonError;
  e.neonMessage = originalMessage;
  if (
    ![
      "RATE_LIMIT",
      "PRODUCT_NOT_FOUND",
      "BAD_PHONE",
      "BAD_MODE",
      "OPTION_UNAVAILABLE",
      "INVALID_CUSTOMER",
    ].some((code) => originalMessage.includes(code))
  ) {
    e.message = SERVICE_ERROR;
  }
  return e;
}

function isTransient(error: unknown): boolean {
  const e = error as NeonError;
  return (
    e?.status === 429 ||
    e?.status === 500 ||
    e?.status === 502 ||
    e?.status === 503 ||
    e?.status === 504 ||
    ["40001", "40P01", "53300", "57P01"].includes(e?.code ?? "")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toNeonResult<R>(result: unknown, query: string): NeonResult<R> {
  const rows: R[] = Array.isArray(result)
    ? (result as R[])
    : ((result as { rows?: R[] } | null)?.rows ?? []);

  const rowCount = Array.isArray(result)
    ? rows.length
    : ((result as { rowCount?: number | null } | null)?.rowCount ?? rows.length);

  return {
    rows,
    rowCount,
    command: commandOf(query),
  };
}
export async function neonQuery<R = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<NeonResult<R>> {
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await getSql().query(query, params);
      return toNeonResult<R>(result, query);
    } catch (error) {
      if (attempt < 2 && isTransient(error)) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      throw normalizeError(error);
    }
  }
}

export async function neonExecute<R = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<NeonResult<R>> {
  try {
    const result = await getSql().query(query, params);
    return toNeonResult<R>(result, query);
  } catch (error) {
    throw normalizeError(error);
  }
}

/** ClÃ© anti-abus hachÃ©e : l'adresse IP n'est jamais conservÃ©e en clair. */
export async function clientKey(): Promise<string> {
  let ip = "";
  try {
    ip =
      (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip")?.trim() ||
      "";
  } catch {
    ip = "";
  }
  let source = ip;
  if (!source) {
    let fallback = "unknown-client";
    try {
      fallback = `${getRequestHeader("user-agent") ?? "unknown"}|${getRequestHeader("accept-language") ?? "unknown"}`;
    } catch {
      /* no request context */
    }
    source = `no-ip:${fallback}`;
  }
  return `${ip ? "ip" : "fallback"}:${crypto.createHash("sha256").update(source).digest("hex")}`;
}

/** Compteur atomique persistant. L'absence d'IP utilise une limite distincte et plus stricte. */
let lastRateLimitCleanup = 0;

export async function consumeRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (Date.now() - lastRateLimitCleanup > 60 * 60 * 1000) {
    await neonExecute("delete from rate_limits where updated_at < now() - interval '30 days'");
    lastRateLimitCleanup = Date.now();
  }
  const rateLimitResult = await neonExecute<{ allowed: boolean }>(
    `insert into rate_limits (scope, key_hash, window_started_at, hits)
     values ($1, $2, now(), 1)
     on conflict (scope, key_hash) do update set
       hits = case when rate_limits.window_started_at < now() - ($4 * interval '1 second') then 1 else rate_limits.hits + 1 end,
       window_started_at = case when rate_limits.window_started_at < now() - ($4 * interval '1 second') then now() else rate_limits.window_started_at end,
       updated_at = now()
     returning (hits <= $3) as allowed`,
    [scope, key, limit, windowSeconds],
  );
  const rows = rateLimitResult.rows;
  console.info("[RATE LIMIT RAW DEBUG]", {
    rowCount: rateLimitResult.rowCount,
    rowsLength: rateLimitResult.rows.length,
    command: rateLimitResult.command,
  });
  console.info("[RATE LIMIT DEBUG]", {
    hasRow: Boolean(rows[0]),
    allowed: rows[0]?.allowed,
    allowedType: typeof rows[0]?.allowed,
  });
  return rows[0]?.allowed === true;
}
