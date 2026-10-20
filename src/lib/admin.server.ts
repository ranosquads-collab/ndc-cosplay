import crypto from "crypto";
import { del } from "@vercel/blob";
import { clientKey, consumeRateLimit, neonExecute, neonQuery } from "./neon.server";
import type {
  CategoryKey,
  HomeImage,
  Order,
  OrderStatus,
  PaymentReceived,
  Product,
  Settings,
} from "./types";

export const ADMIN_EMAIL = process.env["ADMIN_EMAIL"]?.trim() ?? "";
export const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "";
export const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "";

function adminConfigurationError(): string | null {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET) {
    return "Configuration administrateur incomplète : définis ADMIN_EMAIL, ADMIN_PASSWORD et SESSION_SECRET dans les variables d’environnement.";
  }
  if (ADMIN_PASSWORD.length < 12) return "ADMIN_PASSWORD doit contenir au moins 12 caractères.";
  if (SESSION_SECRET.length < 32) return "SESSION_SECRET doit contenir au moins 32 caractères.";
  return null;
}

const COOKIE_NAME = "ndc_admin_session";
const LOCKOUT_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
    }),
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (!safeCompare(sigB64, expectedSig)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as {
      email?: string;
      exp?: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return false;
    if (payload.email !== ADMIN_EMAIL) return false;
    return true;
  } catch {
    return false;
  }
}

async function safeGetCookie(): Promise<string> {
  try {
    const s = await import("@tanstack/react-start/server");
    return s.getRequestHeader("cookie") ?? "";
  } catch {
    return "";
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const cookieHeader = await safeGetCookie();
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (!match || !match[1]) return false;
    return verifySessionToken(decodeURIComponent(match[1]));
  } catch {
    return false;
  }
}

export async function assertAdminAuth() {
  if (!(await isUserAuthenticated())) {
    throw new Error("UNAUTHORIZED: Session administrateur requise");
  }
}

async function safeSetSessionCookie(token: string) {
  try {
    const s = await import("@tanstack/react-start/server");
    s.setResponseHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  } catch {
    // Dans l'environnement de test direct
  }
}

async function safeClearSessionCookie() {
  try {
    const s = await import("@tanstack/react-start/server");
    s.setResponseHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  } catch {
    // Dans l'environnement de test direct
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function handleAdminCheckAuth(): Promise<{ authenticated: boolean; email?: string }> {
  const ok = await isUserAuthenticated();
  return {
    authenticated: ok,
    email: ok ? ADMIN_EMAIL : undefined,
  };
}

export async function handleAdminLogin(
  data: { email: string; password: string },
  clientIp?: string,
): Promise<
  { ok: true } | { ok: false; error: "invalid_credentials" | "locked_out"; message: string }
> {
  const ip = clientIp || (await clientKey());
  const configError = adminConfigurationError();
  if (configError) return { ok: false, error: "invalid_credentials", message: configError };

  // 1. Vérification du blocage anti force-brute (15 min / 5 échecs)
  const effectiveAttemptLimit = ip.startsWith("fallback:") ? 3 : MAX_FAILED_ATTEMPTS;
  const attemptsAllowed = await consumeRateLimit(
    "admin-login",
    ip,
    effectiveAttemptLimit,
    LOCKOUT_MINUTES * 60,
  );
  const { rows: attemptRows } = await neonQuery<{ hits: number }>(
    "select hits from rate_limits where scope = $1 and key_hash = $2",
    ["admin-login", ip],
  );
  const attemptsCount = Number(attemptRows[0]?.hits ?? 0);
  console.info("[ADMIN LOGIN DEBUG]", {
    fallback: ip.startsWith("fallback:"),
    limit: effectiveAttemptLimit,
    attemptsAllowed,
    attemptsCount,
  });
  if (!attemptsAllowed || attemptsCount > effectiveAttemptLimit) {
    return {
      ok: false,
      error: "locked_out",
      message: `Compte temporairement bloqué suite à ${effectiveAttemptLimit} tentatives échouées. Réessayez dans ${LOCKOUT_MINUTES} minutes.`,
    };
  }

  // 2. Vérification des identifiants (email strict + mot de passe sécurisé)
  const emailMatches = safeCompare(data.email.toLowerCase(), ADMIN_EMAIL.toLowerCase());
  const passMatches = safeCompare(data.password, ADMIN_PASSWORD);

  if (!emailMatches || !passMatches) {
    const remaining = Math.max(0, effectiveAttemptLimit - attemptsCount);
    const message =
      remaining > 0
        ? `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} avant blocage de 15 min.`
        : `Identifiants incorrects. Compte bloqué pendant ${LOCKOUT_MINUTES} minutes.`;

    return {
      ok: false,
      error: remaining > 0 ? "invalid_credentials" : "locked_out",
      message,
    };
  }

  // 3. Succès : efface les échecs et génère le cookie
  await neonExecute("delete from rate_limits where scope = $1 and key_hash = $2", [
    "admin-login",
    ip,
  ]);
  const token = signSession(ADMIN_EMAIL);
  await safeSetSessionCookie(token);
  return { ok: true };
}

export async function handleAdminLogout() {
  await safeClearSessionCookie();
  return { ok: true };
}

export async function handleAdminGetOrders(status?: string): Promise<Order[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Order>("select * from orders order by created_at desc");
  if (status && status !== "all") {
    return rows.filter((o) => o.status === status);
  }
  return rows;
}

export async function handleAdminUpdateOrderStatus(orderId: string, status: OrderStatus) {
  await assertAdminAuth();
  await neonExecute("update orders set status = $1 where id = $2", [status, orderId]);
  return { ok: true };
}

export async function handleAdminUpdateOrderPayment(
  orderId: string,
  paymentReceived: PaymentReceived,
) {
  await assertAdminAuth();
  await neonExecute("update orders set payment_received = $1 where id = $2", [
    paymentReceived,
    orderId,
  ]);
  return { ok: true };
}

export async function handleAdminUpdateOrderNotes(orderId: string, notes: string) {
  await assertAdminAuth();
  await neonExecute("update orders set internal_notes = $1 where id = $2", [notes, orderId]);
  return { ok: true };
}

export async function handleAdminDeleteOrder(orderId: string) {
  await assertAdminAuth();
  await neonExecute("delete from orders where id = $1", [orderId]);
  return { ok: true };
}

export async function handleAdminGetProducts(): Promise<Product[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Product>("select * from products order by created_at desc");
  return rows;
}

export async function handleAdminSaveProduct(
  data: Partial<Product> & { name: string; category: CategoryKey },
): Promise<{ ok: true; product: Product }> {
  await assertAdminAuth();
  const isNew = !data.id;
  const id = data.id || crypto.randomUUID();
  const baseSlug = slugify(data.name) || "cosplay";
  const slug = isNew ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const payload: Product & { created_at?: string } = {
    id,
    slug,
    name: data.name,
    category: data.category,
    universe: data.universe ?? "",
    description: data.description ?? "",
    base_price: data.base_price ?? 0,
    weapon_price: data.weapon_price ?? null,
    accessories_price: data.accessories_price ?? null,
    weapon_only_price: data.weapon_only_price ?? null,
    accessories_only_price: data.accessories_only_price ?? null,
    production_days: data.production_days ?? 14,
    urgent_days: data.urgent_days ?? 7,
    featured: Boolean(data.featured ?? false),
    active: data.active !== undefined ? Boolean(data.active) : true,
    images: data.images ?? [],
    created_at: new Date().toISOString(),
  };

  if (isNew) {
    await neonExecute(
      `insert into products (id, slug, name, category, universe, description, base_price, weapon_price, accessories_price, weapon_only_price, accessories_only_price, production_days, urgent_days, images, featured, active)
       values ($1::text,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id,
        slug,
        payload.name,
        payload.category,
        payload.universe,
        payload.description,
        payload.base_price,
        payload.weapon_price,
        payload.accessories_price,
        payload.weapon_only_price,
        payload.accessories_only_price,
        payload.production_days,
        payload.urgent_days,
        payload.images,
        payload.featured,
        payload.active,
      ],
    );
  } else {
    await neonExecute(
      `update products set slug=$1,name=$2,category=$3,universe=$4,description=$5,base_price=$6,weapon_price=$7,accessories_price=$8,weapon_only_price=$9,accessories_only_price=$10,production_days=$11,urgent_days=$12,images=$13,featured=$14,active=$15 where id=$16::text`,
      [
        slug,
        payload.name,
        payload.category,
        payload.universe,
        payload.description,
        payload.base_price,
        payload.weapon_price,
        payload.accessories_price,
        payload.weapon_only_price,
        payload.accessories_only_price,
        payload.production_days,
        payload.urgent_days,
        payload.images,
        payload.featured,
        payload.active,
        id,
      ],
    );
  }

  return { ok: true, product: payload };
}

export async function handleAdminToggleProductActive(productId: string, active: boolean) {
  await assertAdminAuth();
  await neonExecute("update products set active = $1 where id = $2::text", [active, productId]);
  return { ok: true };
}

export async function handleAdminDuplicateProduct(
  productId: string,
): Promise<{ ok: true; product: Product }> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Product>("select * from products where id = $1 limit 1", [
    productId,
  ]);
  const src = rows[0];
  if (!src) throw new Error("Produit introuvable");

  const newId = crypto.randomUUID();
  const newSlug = `${src.slug}-copie-${Date.now().toString(36).slice(-4)}`;
  const clone: Product & { created_at: string } = {
    ...src,
    id: newId,
    name: `${src.name} (Copie)`,
    slug: newSlug,
    created_at: new Date().toISOString(),
  };

  await neonExecute(
    `insert into products (id,slug,name,category,universe,description,base_price,weapon_price,accessories_price,weapon_only_price,accessories_only_price,production_days,urgent_days,images,featured,active)
     values ($1::text,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      clone.id,
      clone.slug,
      clone.name,
      clone.category,
      clone.universe,
      clone.description,
      clone.base_price,
      clone.weapon_price,
      clone.accessories_price,
      clone.weapon_only_price,
      clone.accessories_only_price,
      clone.production_days,
      clone.urgent_days,
      clone.images,
      clone.featured,
      clone.active,
    ],
  );
  return { ok: true, product: clone };
}

export async function handleAdminDeleteProduct(productId: string) {
  await assertAdminAuth();
  await neonExecute("delete from products where id = $1", [productId]);
  return { ok: true };
}

export async function handleAdminGetHomeImages(): Promise<HomeImage[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<HomeImage>(
    "select * from home_images order by position, created_at",
  );
  return rows;
}

export async function handleAdminSaveHomeImage(data: {
  id?: string;
  url: string;
  caption?: string;
  kind: "hero" | "carousel" | "category" | "gallery";
  category_key?: "anime" | "marvel" | "dc" | "jeux" | "armes" | null;
  position?: number;
}) {
  await assertAdminAuth();
  if (data.kind === "hero") {
    const { rows } = await neonQuery<HomeImage>("select * from home_images");
    const existingHero = rows.find((r) => r.kind === "hero");
    if (existingHero) {
      await neonExecute("delete from home_images where id = $1", [existingHero.id]);
    }
  } else if (data.kind === "category" && data.category_key) {
    const { rows } = await neonQuery<HomeImage>("select * from home_images");
    const existing = rows.find(
      (r) => r.kind === "category" && r.category_key === data.category_key,
    );
    if (existing) {
      await neonExecute("delete from home_images where id = $1", [existing.id]);
    }
  }

  await neonExecute(
    `insert into home_images (id,url,caption,kind,category_key,position)
     values (coalesce($1::text,gen_random_uuid()::text),$2,$3,$4,$5,$6)
     on conflict (id) do update set url=excluded.url,caption=excluded.caption,kind=excluded.kind,category_key=excluded.category_key,position=excluded.position`,
    [
      data.id ?? null,
      data.url,
      data.caption ?? "",
      data.kind,
      data.category_key ?? null,
      data.position ?? 0,
    ],
  );
  return { ok: true };
}

export async function handleAdminDeleteHomeImage(id: string) {
  await assertAdminAuth();
  await neonExecute("delete from home_images where id = $1", [id]);
  return { ok: true };
}

export async function handleAdminReorderHomeImages(items: { id: string; position: number }[]) {
  await assertAdminAuth();
  for (const item of items) {
    await neonExecute("update home_images set position = $1 where id = $2", [
      item.position,
      item.id,
    ]);
  }
  return { ok: true };
}

export async function handleAdminDeletePhotoFile(url: string) {
  await assertAdminAuth();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) throw new Error("Configuration manquante : BLOB_READ_WRITE_TOKEN.");
  if (url.startsWith("https://") && url.includes(".public.blob.vercel-storage.com/")) {
    await del(url, { token: blobToken });
  } else if (url.startsWith("/uploads/")) {
    // Les anciens fichiers locaux ne sont plus servis par Vercel.
    return { ok: true };
  } else {
    throw new Error("URL de photo invalide.");
  }
  return { ok: true };
}

export async function handleAdminUpdateSettings(data: Settings) {
  await assertAdminAuth();
  await neonExecute(
    `insert into settings (id,whatsapp,instagram,tiktok,email,deposit_percent,urgent_fee_percent,delivery_zones,logo_text,logo_url)
     values (1,$1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
     on conflict (id) do update set whatsapp=excluded.whatsapp,instagram=excluded.instagram,tiktok=excluded.tiktok,email=excluded.email,deposit_percent=excluded.deposit_percent,urgent_fee_percent=excluded.urgent_fee_percent,delivery_zones=excluded.delivery_zones,logo_text=excluded.logo_text,logo_url=excluded.logo_url,updated_at=now()`,
    [
      data.whatsapp,
      data.instagram,
      data.tiktok,
      data.email,
      data.deposit_percent,
      data.urgent_fee_percent,
      JSON.stringify(data.delivery_zones ?? []),
      data.logo_text,
      data.logo_url,
    ],
  );
  return { ok: true };
}
