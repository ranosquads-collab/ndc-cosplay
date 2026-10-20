import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clientKey, consumeRateLimit, neonExecute, neonQuery } from "./neon.server";
import { phoneKey, type HomeImage, type OrderStatus, type Product, type Settings } from "./types";

const PRODUCT_COLS =
  "id::text, slug, name, universe, category, description, images, base_price, weapon_price, accessories_price, weapon_only_price, accessories_only_price, production_days, urgent_days, featured, active";

const DEFAULT_SETTINGS: Settings = {
  whatsapp: "",
  instagram: "",
  tiktok: null,
  email: "",
  deposit_percent: null,
  urgent_fee_percent: null,
  delivery_zones: [],
  logo_text: "NDC COSPLAY",
  logo_url: null,
};

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Settings> => {
    const { rows } = await neonQuery<Settings>(
      "select whatsapp, instagram, tiktok, email, deposit_percent, urgent_fee_percent, delivery_zones, logo_text, logo_url from settings where id = 1",
    );
    const s = rows[0];
    if (!s) return DEFAULT_SETTINGS;
    return {
      ...s,
      tiktok: s.tiktok?.trim() || null,
      delivery_zones: Array.isArray(s.delivery_zones) ? s.delivery_zones : [],
      logo_text: s.logo_text || "NDC COSPLAY",
      logo_url: s.logo_url || null,
    };
  },
);

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { rows } = await neonQuery<Product>(
      `select ${PRODUCT_COLS} from products where active order by featured desc, name limit 500`,
    );
    return rows;
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<Product | null> => {
    const { rows } = await neonQuery<Product>(
      `select ${PRODUCT_COLS} from products where active and slug = $1 limit 1`,
      [data.slug],
    );
    return rows[0] ?? null;
  });

export const getHomeImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeImage[]> => {
    const { rows } = await neonQuery<HomeImage>(
      "select id::text, kind, category_key, url, caption, position from home_images order by position, created_at limit 200",
    );
    return rows;
  },
);

const phoneRe = /^(\+?221)?\s?7[05678]\s?\d{3}\s?\d{2}\s?\d{2}$/;
const orderSchema = z.object({
  product_id: z.string().min(1).max(100),
  mode: z.enum(["cosplay", "armes", "accessoires", "armes_accessoires"]),
  with_weapon: z.boolean(),
  with_accessories: z.boolean(),
  urgent: z.boolean(),
  gender: z.string().max(20).nullable(),
  size: z.string().max(10).nullable(),
  measurements: z.record(z.string().max(20), z.number().min(0).max(250)).nullable(),
  unsure_size: z.boolean(),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(phoneRe),
  address: z.string().trim().min(3).max(300),
  payment_preference: z.enum(["moitie", "totalite", "livraison"]),
  // Anti-spam : champ piège (doit rester vide) et temps de remplissage.
  website: z.string().max(200),
  elapsed_ms: z.number(),
});

export type CreateOrderResult =
  | { ok: true; order_number: string; total: number | null }
  | { ok: false; error: "rate_limit" | "invalid" | "unavailable" };

export const createOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    if (data.website || data.elapsed_ms < 3000) return { ok: false, error: "invalid" };
    const { website: _w, elapsed_ms: _e, ...payload } = data;
    try {
      const { rows } = await neonExecute<{ order_number: string; total: number | null }>(
        "select order_number, total from public.create_order($1::jsonb, $2::text)",
        [payload, await clientKey()],
      );
      const row = rows[0];

      console.info("[TRACK ORDER DEBUG]", {
        number,
        phoneLookup,
        rowCount: rows.length,
        found: Boolean(rows[0]),
      });

      if (!row) return { ok: false, error: "unavailable" };
      return {
        ok: true,
        order_number: row.order_number,
        total: row.total == null ? null : Number(row.total),
      };
    } catch (err: unknown) {
      console.error(err);
      const m =
        typeof err === "object" && err !== null && "neonMessage" in err
          ? String((err as { neonMessage: unknown }).neonMessage)
          : "";
      if (m.includes("RATE_LIMIT")) return { ok: false, error: "rate_limit" };
      if (/PRODUCT_NOT_FOUND|BAD_MODE|BAD_PHONE|OPTION_UNAVAILABLE|INVALID_CUSTOMER/.test(m))
        return { ok: false, error: "invalid" };
      return { ok: false, error: "unavailable" };
    }
  });

export type TrackResult =
  | {
      ok: true;
      order_number: string;
      product_name: string;
      status: OrderStatus;
      created_at: string;
    }
  | { ok: false };

export const trackOrder = createServerFn({ method: "POST" })
  .validator((d: { number: string; phone: string }) =>
    z.object({ number: z.string().trim().max(20), phone: z.string().trim().max(25) }).parse(d),
  )
  .handler(async ({ data }): Promise<TrackResult> => {
    try {
      const key = await clientKey();
      const limit = key.startsWith("fallback:") ? 4 : 10;
      if (!(await consumeRateLimit("track-order", key, limit, 15 * 60))) return { ok: false };
      const digits = data.number.replace(/\D/g, "");
      const phoneLookup = phoneKey(data.phone);
      if (!digits || phoneLookup.length !== 9) return { ok: false };
      const number = `NDC-${digits.padStart(4, "0")}`;
      const { rows } = await neonQuery<{
        order_number: string;
        product_name: string;
        status: OrderStatus;
        created_at: string;
      }>(
        `select order_number, product_name, status,
                to_json(created_at) as created_at
         from public.orders
         where order_number = $1
           and right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = $2
         limit 1`,
        [number, phoneLookup],
      );
      const row = rows[0];
      return row ? { ok: true, ...row } : { ok: false };
    } catch (error) {
      console.error("Order tracking unavailable:", error);
      return { ok: false };
    }
  });
