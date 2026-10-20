import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  handleAdminCheckAuth,
  handleAdminDeleteHomeImage,
  handleAdminDeleteOrder,
  handleAdminDeletePhotoFile,
  handleAdminDeleteProduct,
  handleAdminDuplicateProduct,
  handleAdminGetHomeImages,
  handleAdminGetOrders,
  handleAdminGetProducts,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminReorderHomeImages,
  handleAdminSaveHomeImage,
  handleAdminSaveProduct,
  handleAdminToggleProductActive,
  handleAdminUpdateOrderNotes,
  handleAdminUpdateOrderPayment,
  handleAdminUpdateOrderStatus,
  handleAdminUpdateSettings,
} from "./admin.server";
import type {
  CategoryKey,
  HomeImage,
  Order,
  OrderStatus,
  PaymentReceived,
  Product,
  Settings,
} from "./types";

export const adminCheckAuth = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ authenticated: boolean; email?: string }> => handleAdminCheckAuth(),
);

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) =>
    z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminLogin(data));

export const adminLogout = createServerFn({ method: "POST" }).handler(async () =>
  handleAdminLogout(),
);

export const adminGetOrders = createServerFn({ method: "GET" })
  .validator((d?: { status?: string }) =>
    z.object({ status: z.string().optional() }).optional().parse(d),
  )
  .handler(async ({ data }) => handleAdminGetOrders(data?.status));

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; status: OrderStatus }) =>
    z
      .object({
        orderId: z.string(),
        status: z.enum(["nouvelle", "confirmee", "en_fabrication", "prete", "livree"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderStatus(data.orderId, data.status));

export const adminUpdateOrderPayment = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; paymentReceived: PaymentReceived }) =>
    z
      .object({
        orderId: z.string(),
        paymentReceived: z.enum(["non", "acompte", "total"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderPayment(data.orderId, data.paymentReceived));

export const adminUpdateOrderNotes = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; notes: string }) =>
    z.object({ orderId: z.string(), notes: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderNotes(data.orderId, data.notes));

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .validator((d: { orderId: string }) => z.object({ orderId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteOrder(data.orderId));

export const adminGetProducts = createServerFn({ method: "GET" }).handler(async () =>
  handleAdminGetProducts(),
);

export const adminSaveProduct = createServerFn({ method: "POST" })
  .validator((d: Partial<Product> & { name: string; category: CategoryKey }) => d)
  .handler(async ({ data }) => handleAdminSaveProduct(data));

export const adminToggleProductActive = createServerFn({ method: "POST" })
  .validator((d: { productId: string; active: boolean }) =>
    z.object({ productId: z.string(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => handleAdminToggleProductActive(data.productId, data.active));

export const adminDuplicateProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDuplicateProduct(data.productId));

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteProduct(data.productId));

export const adminGetHomeImages = createServerFn({ method: "GET" }).handler(async () =>
  handleAdminGetHomeImages(),
);

export const adminSaveHomeImage = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id?: string;
      url: string;
      caption?: string;
      kind: "hero" | "carousel" | "category" | "gallery";
      category_key?: "anime" | "marvel" | "dc" | "jeux" | "armes" | null;
      position?: number;
    }) => d,
  )
  .handler(async ({ data }) => handleAdminSaveHomeImage(data));

export const adminDeleteHomeImage = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteHomeImage(data.id));

export const adminReorderHomeImages = createServerFn({ method: "POST" })
  .validator((d: { items: { id: string; position: number }[] }) =>
    z
      .object({
        items: z.array(z.object({ id: z.string(), position: z.number() })),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminReorderHomeImages(data.items));

export const adminDeletePhotoFile = createServerFn({ method: "POST" })
  .validator((d: { url: string }) => z.object({ url: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeletePhotoFile(data.url));

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .validator((d: Settings) => d)
  .handler(async ({ data }) => handleAdminUpdateSettings(data));
