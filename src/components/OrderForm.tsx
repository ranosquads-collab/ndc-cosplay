import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import {
  availableModes,
  computePrice,
  effectiveOptions,
  formatPrice,
  MODE_LABELS,
  PRICE_ON_REQUEST,
  urgentAvailable,
  type OrderMode,
} from "@/lib/pricing";
import { createOrder } from "@/lib/data.functions";
import type { Product, Settings } from "@/lib/queries";
import { PAYMENT_PREFS, type PaymentPref } from "@/lib/types";
import { GENDERS, MEASURES, SIZES } from "@/lib/content";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";
import { SizeGuide } from "./SizeGuide";
import { WhatsAppIcon } from "./icons";

const phoneRe = /^(\+?221)?\s?7[05678]\s?\d{3}\s?\d{2}\s?\d{2}$/;
const customerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  phone: z.string().trim().regex(phoneRe, "Numéro sénégalais invalide (ex : 77 123 45 67)"),
  address: z.string().trim().min(3, "Adresse requise").max(300),
});

export function OrderForm({
  product,
  settings,
  initialMode,
}: {
  product: Product;
  settings: Settings;
  initialMode?: OrderMode | undefined;
}) {
  const navigate = useNavigate();
  const modes = availableModes(product);
  const [mode, setMode] = useState<OrderMode>(
    initialMode && modes.includes(initialMode) ? initialMode : "cosplay",
  );
  const [withWeapon, setWithWeapon] = useState(product.weapon_price != null);
  const [withAccessories, setWithAccessories] = useState(product.accessories_price != null);
  const [urgent, setUrgent] = useState(false);
  const [gender, setGender] = useState<(typeof GENDERS)[number]>("Homme");
  const [sizeMode, setSizeMode] = useState<"standard" | "custom">("standard");
  const [size, setSize] = useState<string>("M");
  const [measures, setMeasures] = useState<Record<string, string>>({});
  const [unsure, setUnsure] = useState(false);
  const [payment, setPayment] = useState<PaymentPref>("moitie");
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", phone: "", address: "" });
  const [website, setWebsite] = useState(""); // champ piège anti-spam
  const openedAt = useRef(Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const canUrgent = urgentAvailable(product, settings.urgent_fee_percent);
  const rawOptions = { mode, withWeapon, withAccessories, urgent: canUrgent && urgent };
  const options = effectiveOptions(product, rawOptions, settings.urgent_fee_percent);
  const total = computePrice(product, rawOptions, settings.urgent_fee_percent);
  const needsSize = mode === "cosplay";

  const sizeLabel = () => {
    if (!needsSize) return "Non applicable (arme/accessoires)";
    if (unsure) return "Pas sûr(e) — à définir avec le créateur";
    if (sizeMode === "standard") return size;
    const parts = MEASURES.filter((m) => measures[m.key]).map(
      (m) => `${m.label} ${measures[m.key]} cm`,
    );
    return parts.length ? `Mesures : ${parts.join(", ")}` : "Mesures à préciser";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customerSchema.safeParse(customer);
    const errs: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
    if (
      needsSize &&
      !unsure &&
      sizeMode === "custom" &&
      !["poitrine", "taille", "hanches", "hauteur"].every((k) => Number(measures[k]) > 0)
    ) {
      errs["measures"] = "Indiquez au moins poitrine, taille, hanches et hauteur.";
    }
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.success) {
      toast.error("Vérifiez le formulaire");
      return;
    }

    const whatsappWindow = window.open("about:blank", "_blank");

    setLoading(true);
    const measurementsPayload =
      needsSize && !unsure && sizeMode === "custom"
        ? Object.fromEntries(
            Object.entries(measures)
              .filter(([, v]) => Number(v) > 0)
              .map(([k, v]) => [k, Number(v)]),
          )
        : null;
    const result = await createOrder({
      data: {
        product_id: product.id,
        mode,
        with_weapon: withWeapon,
        with_accessories: withAccessories,
        urgent: rawOptions.urgent,
        gender: needsSize ? gender : null,
        size: needsSize && !unsure && sizeMode === "standard" ? size : null,
        measurements: measurementsPayload,
        unsure_size: needsSize && unsure,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        payment_preference: payment,
        website,
        elapsed_ms: Date.now() - openedAt.current,
      },
    });
    setLoading(false);
    if (!result.ok) {
      whatsappWindow?.close();

      toast.error(
        result.error === "rate_limit"
          ? "Vous avez déjà passé plusieurs commandes récemment. Réessayez plus tard ou écrivez-nous sur WhatsApp."
          : "La commande n'a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp.",
      );
      return;
    }
    const origin = window.location.origin;
    const firstImage = product.images[0];
    const message = buildOrderMessage({
      orderNumber: result.order_number,
      productName: product.name,
      productUrl: `${origin}/cosplay/${product.slug}`,
      imageUrl: firstImage?.startsWith("http") ? firstImage : null,
      options,
      productionDays: product.production_days,
      total: result.total,
      payment,
      gender: needsSize ? gender : "—",
      sizeLabel: sizeLabel(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      address: parsed.data.address,
    });
    sessionStorage.setItem(
      "ndc_last_order",
      JSON.stringify({
        number: result.order_number,
        total: result.total,
        product: product.name,
        phone: parsed.data.phone,
        message,
      }),
    );
    if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.location.href = waLink(settings.whatsapp, message);
    }

    navigate({ to: "/commande-confirmee" });
  };

  const Err = ({ k }: { k: string }) =>
    errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;
  let step = 0;

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      {/* Formule */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
          {++step}. Formule
        </legend>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              type="button"
              key={m}
              className="chip"
              data-active={mode === m}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        {mode === "cosplay" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Avec arme"
              price={product.weapon_price}
              checked={withWeapon}
              onChange={setWithWeapon}
            />
            <Toggle
              label="Avec accessoires"
              price={product.accessories_price}
              checked={withAccessories}
              onChange={setWithAccessories}
            />
          </div>
        )}
        {canUrgent && (
          <label className="mt-3 flex cursor-pointer items-center gap-3 border-2 border-border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            <Zap className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm">
              <strong>Commande urgente</strong> — environ {product.urgent_days} jours au lieu de{" "}
              {product.production_days}
            </span>
            <span className="text-xs text-muted-foreground">+{settings.urgent_fee_percent} %</span>
          </label>
        )}
      </fieldset>

      {/* Taille */}
      {needsSize && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
            {++step}. Taille
          </legend>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button
                type="button"
                key={g}
                className="chip flex-1 justify-center"
                data-active={gender === g}
                onClick={() => setGender(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-b-2 border-border">
            {(["standard", "custom"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSizeMode(s)}
                className={`-mb-0.5 border-b-2 px-3 py-2 text-sm font-semibold ${sizeMode === s ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                {s === "standard" ? "Taille standard" : "Mes propres mesures"}
              </button>
            ))}
          </div>
          <div className={unsure ? "pointer-events-none opacity-40" : ""}>
            {sizeMode === "standard" ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {SIZES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className="chip justify-center"
                    data-active={size === s}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {MEASURES.map((m) => (
                  <label key={m.key} className="text-xs text-muted-foreground">
                    {m.label} (cm)
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={250}
                      value={measures[m.key] ?? ""}
                      onChange={(e) => setMeasures({ ...measures, [m.key]: e.target.value })}
                      className="field mt-1"
                    />
                  </label>
                ))}
              </div>
            )}
            <Err k="measures" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <SizeGuide />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unsure}
                onChange={(e) => setUnsure(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Je ne suis pas sûr(e) de ma taille
            </label>
          </div>
          {unsure && (
            <p className="mt-2 text-xs text-accent">
              Pas de souci : le créateur vous contactera pour prendre vos mesures.
            </p>
          )}
        </fieldset>
      )}

      {/* Paiement souhaité */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
          {++step}. Paiement souhaité
        </legend>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_PREFS.map((p) => (
            <button
              type="button"
              key={p.key}
              className="chip"
              data-active={payment === p.key}
              onClick={() => setPayment(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Le paiement se règle directement sur WhatsApp, après validation.
        </p>
      </fieldset>

      {/* Client */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
          {++step}. Vos informations
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <input
              className="field"
              placeholder="Prénom"
              autoComplete="given-name"
              maxLength={80}
              value={customer.firstName}
              onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
            />
            <Err k="firstName" />
          </div>
          <div>
            <input
              className="field"
              placeholder="Nom"
              autoComplete="family-name"
              maxLength={80}
              value={customer.lastName}
              onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
            />
            <Err k="lastName" />
          </div>
          <div className="sm:col-span-2">
            <div className="flex">
              <span className="flex items-center border-2 border-r-0 border-border bg-muted px-3 text-sm font-semibold">
                +221
              </span>
              <input
                className="field"
                type="tel"
                inputMode="tel"
                placeholder="77 123 45 67"
                autoComplete="tel"
                maxLength={20}
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <Err k="phone" />
          </div>
          <div className="sm:col-span-2">
            <textarea
              className="field min-h-20"
              placeholder="Adresse de livraison (quartier, ville, repère)"
              autoComplete="street-address"
              maxLength={300}
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            />
            <Err k="address" />
          </div>
        </div>
        {/* Champ piège anti-robots — invisible pour les humains */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] top-0 h-px w-px opacity-0"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </fieldset>

      {/* Total */}
      <div className="manga-panel sticky bottom-3 z-20 flex items-center justify-between gap-4 bg-card p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="font-display text-3xl text-primary">
            {total == null ? PRICE_ON_REQUEST : formatPrice(total)}
          </p>
        </div>
        <button type="submit" disabled={loading} className="btn-manga">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <WhatsAppIcon className="h-5 w-5" />
          )}{" "}
          Commander
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Votre commande est enregistrée puis envoyée sur WhatsApp. Le paiement se règle sur WhatsApp.
      </p>
    </form>
  );
}

function Toggle({
  label,
  price,
  checked,
  onChange,
}: {
  label: string;
  price: number | null;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const disabled = price == null;
  return (
    <label
      className={`flex items-center gap-3 border-2 border-border p-3 transition-colors has-[:checked]:border-foreground has-[:checked]:bg-secondary ${disabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked && !disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--primary)]"
      />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">
        {disabled ? "Non disponible" : `+${formatPrice(price)}`}
      </span>
    </label>
  );
}
