import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Package, Truck } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import { settingsQuery } from "@/lib/queries";

const TITLE = "Livraison cosplay à Dakar et au Sénégal — zones et tarifs | NDC COSPLAY";
const DESC =
  "Zones, délais et tarifs de livraison de vos cosplays sur mesure à Dakar, en banlieue et dans toutes les régions du Sénégal.";

export const Route = createFileRoute("/livraison")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: Delivery,
});

function Delivery() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const zones = s.delivery_zones;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">配送</p>
      <h1 className="font-display mt-1 text-4xl md:text-6xl">Livraison</h1>
      <p className="mt-4 text-muted-foreground">
        Votre cosplay est soigneusement emballé et livré partout au Sénégal.
      </p>
      {zones.length > 0 ? (
        <div className="mt-10 space-y-3">
          {zones.map((z) => (
            <div key={z.zone} className="manga-panel flex items-center gap-4 bg-card p-4">
              <Truck className="h-6 w-6 shrink-0 text-accent" />
              <div className="flex-1">
                <p className="font-bold">{z.zone}</p>
                {z.delai && <p className="text-sm text-muted-foreground">{z.delai}</p>}
              </div>
              <p className="font-display text-xl text-primary">
                {z.prix === 0 ? "Gratuit" : formatPrice(z.prix)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 flex gap-3 border-l-4 border-sakura bg-card p-5 text-sm text-muted-foreground">
          <Package className="h-5 w-5 shrink-0 text-sakura" />
          <p>Tarif et délai confirmés sur WhatsApp lors de la validation de votre commande.</p>
        </div>
      )}
      <div className="mt-10 flex gap-3 border-l-4 border-sakura bg-card p-5 text-sm text-muted-foreground">
        <Package className="h-5 w-5 shrink-0 text-sakura" />
        <p>Le paiement se règle sur WhatsApp ; le solde éventuel est réglé à la réception.</p>
      </div>
    </div>
  );
}
