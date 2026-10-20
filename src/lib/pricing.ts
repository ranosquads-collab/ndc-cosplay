// Calcul du prix — miroir exact de la fonction SQL create_order (base Neon).
// Retourne null quand un prix nécessaire n'est pas renseigné (« Prix sur demande »).
export type OrderMode = "cosplay" | "armes" | "accessoires" | "armes_accessoires";

export interface PriceableProduct {
  base_price: number | null;
  weapon_price: number | null;
  accessories_price: number | null;
  weapon_only_price: number | null;
  accessories_only_price: number | null;
  urgent_days: number | null;
}

export interface PriceOptions {
  mode: OrderMode;
  withWeapon: boolean;
  withAccessories: boolean;
  urgent: boolean;
}

export function availableModes(p: PriceableProduct): OrderMode[] {
  const modes: OrderMode[] = ["cosplay"];
  if (p.weapon_only_price != null) modes.push("armes");
  if (p.accessories_only_price != null) modes.push("accessoires");
  if (p.weapon_only_price != null && p.accessories_only_price != null)
    modes.push("armes_accessoires");
  return modes;
}

export const urgentAvailable = (p: PriceableProduct, urgentFeePercent: number | null) =>
  urgentFeePercent != null && p.urgent_days != null;

/** Options réellement appliquées (identique au serveur). */
export function effectiveOptions(
  p: PriceableProduct,
  o: PriceOptions,
  urgentFeePercent: number | null,
): PriceOptions {
  const cosplay = o.mode === "cosplay";
  return {
    mode: o.mode,
    withWeapon: cosplay && o.withWeapon && p.weapon_price != null,
    withAccessories: cosplay && o.withAccessories && p.accessories_price != null,
    urgent: o.urgent && urgentAvailable(p, urgentFeePercent),
  };
}

export function computePrice(
  p: PriceableProduct,
  opts: PriceOptions,
  urgentFeePercent: number | null,
): number | null {
  const o = effectiveOptions(p, opts, urgentFeePercent);
  let total: number | null;
  switch (o.mode) {
    case "cosplay":
      total =
        p.base_price == null
          ? null
          : p.base_price +
            (o.withWeapon ? p.weapon_price! : 0) +
            (o.withAccessories ? p.accessories_price! : 0);
      break;
    case "armes":
      total = p.weapon_only_price;
      break;
    case "accessoires":
      total = p.accessories_only_price;
      break;
    case "armes_accessoires":
      total =
        p.weapon_only_price == null || p.accessories_only_price == null
          ? null
          : p.weapon_only_price + p.accessories_only_price;
      break;
  }
  if (total != null && o.urgent) total += Math.round((total * urgentFeePercent!) / 100);
  return total;
}

export const MODE_LABELS: Record<OrderMode, string> = {
  cosplay: "Cosplay",
  armes: "Armes uniquement",
  accessoires: "Accessoires uniquement",
  armes_accessoires: "Armes + accessoires uniquement",
};

export function describeFormula(o: PriceOptions): string {
  if (o.mode !== "cosplay") return MODE_LABELS[o.mode];
  if (o.withWeapon && o.withAccessories) return "Cosplay complet (avec arme et accessoires)";
  const parts = [
    o.withWeapon ? "avec arme" : "sans arme",
    o.withAccessories ? "avec accessoires" : "sans accessoires",
  ];
  return `Cosplay ${parts.join(", ")}`;
}

export const PRICE_ON_REQUEST = "Prix sur demande";
export const formatFCFA = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f|\u00a0/g, " ")} FCFA`;
export const formatPrice = (n: number | null | undefined) =>
  n == null ? PRICE_ON_REQUEST : formatFCFA(n);
