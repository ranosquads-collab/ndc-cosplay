export type CategoryKey = "anime" | "marvel" | "dc" | "jeux";

export const CATEGORIES = [
  { key: "anime", label: "Animé", sub: "Tous les univers", jp: "アニメ" },
  { key: "marvel", label: "Marvel", sub: "Héros & vilains", jp: "マーベル" },
  { key: "dc", label: "DC Comics", sub: "Gotham & au-delà", jp: "ディーシー" },
  { key: "jeux", label: "Jeux vidéo", sub: "RPG, action, aventure", jp: "ゲーム" },
] as const;

export interface Product {
  id: string;
  slug: string;
  name: string;
  universe: string;
  category: CategoryKey;
  description: string;
  images: string[];
  base_price: number | null;
  weapon_price: number | null;
  accessories_price: number | null;
  weapon_only_price: number | null;
  accessories_only_price: number | null;
  production_days: number | null;
  urgent_days: number | null;
  featured: boolean;
  active: boolean;
}

export interface HomeImage {
  id: string;
  kind: "hero" | "carousel" | "category" | "gallery";
  category_key: CategoryKey | "armes" | null;
  url: string;
  caption: string;
  position: number;
}

export type DeliveryZone = { zone: string; prix: number | null; delai: string | null };

export interface Settings {
  whatsapp: string;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  deposit_percent: number | null;
  urgent_fee_percent: number | null;
  delivery_zones: DeliveryZone[];
  logo_text?: string;
  logo_url?: string | null;
}

export const PAYMENT_PREFS = [
  { key: "moitie", label: "Moitié à la commande" },
  { key: "totalite", label: "Totalité à la commande" },
  { key: "livraison", label: "À la livraison" },
] as const;
export type PaymentPref = (typeof PAYMENT_PREFS)[number]["key"];

export const PAYMENT_RECEIVED = [
  { key: "non", label: "Non reçu" },
  { key: "acompte", label: "Acompte reçu" },
  { key: "total", label: "Totalité reçue" },
] as const;
export type PaymentReceived = (typeof PAYMENT_RECEIVED)[number]["key"];

export const ORDER_STATUSES = [
  { key: "nouvelle", label: "Nouvelle" },
  { key: "confirmee", label: "Confirmée" },
  { key: "en_fabrication", label: "En fabrication" },
  { key: "prete", label: "Prête" },
  { key: "livree", label: "Livrée" },
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number]["key"];

export interface Order {
  id: string;
  order_number: string;
  product_id: string | null;
  product_name: string;
  product_slug?: string | null;
  product_image?: string | null;
  mode: string;
  with_weapon: boolean;
  with_accessories: boolean;
  urgent: boolean;
  gender: string | null;
  size: string | null;
  measurements: Record<string, number> | null;
  unsure_size: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  phone_key: string;
  address: string;
  total: number | null;
  payment_preference: PaymentPref;
  payment_received: PaymentReceived;
  internal_notes: string;
  status: OrderStatus;
  created_at: string;
}

/** Clé de comparaison du téléphone : les 9 derniers chiffres. */
export const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-9);
