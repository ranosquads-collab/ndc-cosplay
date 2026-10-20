import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, CircleDashed, Loader2, PackageSearch } from "lucide-react";
import { trackOrder, type TrackResult } from "@/lib/data.functions";
import { ORDER_STATUSES } from "@/lib/types";
import { settingsQuery } from "@/lib/queries";

const TITLE = "Suivre ma commande | NDC COSPLAY";
const DESC =
  "Suivez l'avancement de votre cosplay sur mesure : nouvelle, confirmée, en fabrication, prête, livrée.";

export const Route = createFileRoute("/suivi")({
  validateSearch: z.object({ number: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: Suivi,
});

function Suivi() {
  const { number: initialNumber } = Route.useSearch();
  const [number, setNumber] = useState(initialNumber ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      setResult(await trackOrder({ data: { number, phone } }));
    } catch {
      setResult({ ok: false });
    } finally {
      setLoading(false);
    }
  };

  const statusIndex = result?.ok ? ORDER_STATUSES.findIndex((s) => s.key === result.status) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">追跡</p>
      <h1 className="font-display mt-1 text-5xl md:text-6xl">Suivre ma commande</h1>
      <p className="mt-3 text-muted-foreground">
        Entrez votre numéro de commande et le numéro de téléphone utilisé à la commande.
      </p>

      <form onSubmit={submit} className="manga-panel mt-8 space-y-4 bg-card p-6">
        <label className="block text-sm font-semibold">
          Numéro de commande
          <input
            className="field mt-1"
            placeholder="NDC-0001"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Téléphone
          <input
            className="field mt-1"
            type="tel"
            inputMode="tel"
            placeholder="77 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="btn-manga w-full justify-center">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PackageSearch className="h-5 w-5" />
          )}{" "}
          Voir le statut
        </button>
      </form>

      {result && !result.ok && (
        <div className="mt-6 border-2 border-destructive bg-destructive/10 p-4 text-sm">
          Aucune commande trouvée
        </div>
      )}

      {result?.ok && (
        <div className="manga-panel mt-6 bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Commande {result.order_number}
          </p>
          <p className="mt-1 font-bold">{result.product_name}</p>
          <ol className="mt-6 space-y-4">
            {ORDER_STATUSES.map((s, i) => {
              const done = i <= statusIndex;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
                  ) : (
                    <CircleDashed className="h-6 w-6 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={done ? "font-semibold" : "text-muted-foreground/60"}>
                    {s.label}
                  </span>
                  {i === statusIndex && (
                    <span className="ml-auto bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">
                      Actuel
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
