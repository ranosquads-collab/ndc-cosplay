import { queryOptions } from "@tanstack/react-query";
import { getHomeImages, getProduct, getProducts, getSettings } from "./data.functions";

export type { Product, HomeImage, DeliveryZone, Settings, CategoryKey } from "./types";

export const CATEGORIES = [
  { key: "anime", label: "Animé", sub: "Tous les univers", jp: "アニメ" },
  { key: "marvel", label: "Marvel", sub: "Héros & vilains", jp: "マーベル" },
  { key: "dc", label: "DC Comics", sub: "Gotham & au-delà", jp: "ディーシー" },
  { key: "jeux", label: "Jeux vidéo", sub: "RPG, action, aventure", jp: "ゲーム" },
] as const;

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  staleTime: 5 * 60_000,
  queryFn: () => getSettings(),
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  staleTime: 60_000,
  queryFn: () => getProducts(),
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    staleTime: 60_000,
    queryFn: () => getProduct({ data: { slug } }),
  });

export const homeImagesQuery = queryOptions({
  queryKey: ["home_images"],
  staleTime: 5 * 60_000,
  queryFn: () => getHomeImages(),
});
