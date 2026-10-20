import { describeFormula, formatPrice, type PriceOptions } from "./pricing";
import { PAYMENT_PREFS, type PaymentPref } from "./types";

export interface OrderMessageInput {
  orderNumber: string;
  productName: string;
  productUrl: string;
  imageUrl: string | null;
  options: PriceOptions;
  productionDays: number | null;
  total: number | null;
  payment: PaymentPref;
  gender: string;
  sizeLabel: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export function buildOrderMessage(o: OrderMessageInput): string {
  const lines = [
    `🎌 *NOUVELLE COMMANDE ${o.orderNumber}*`,
    ``,
    `*Cosplay :* ${o.productName}`,
    `*Formule :* ${describeFormula(o.options)}`,
    o.options.urgent
      ? `*⚡ Commande urgente*`
      : o.productionDays
        ? `*Délai estimé :* ${o.productionDays} jours`
        : null,
    `*Prix total :* ${formatPrice(o.total)}`,
    `*Paiement souhaité :* ${PAYMENT_PREFS.find((p) => p.key === o.payment)?.label}`,
    ``,
    `*Profil :* ${o.gender}`,
    `*Taille :* ${o.sizeLabel}`,
    ``,
    `👤 *Client*`,
    `${o.firstName} ${o.lastName}`,
    `📞 ${o.phone}`,
    `📍 ${o.address}`,
    ``,
    o.imageUrl ? `🖼️ Photo : ${o.imageUrl}` : null,
    `🔗 Fiche : ${o.productUrl}`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
