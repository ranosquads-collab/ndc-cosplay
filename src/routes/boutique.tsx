import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Search, Swords, X } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, productsQuery, settingsQuery } from "@/lib/queries";

const searchSchema = z.object({
  cat: z.enum(["anime", "marvel", "dc", "jeux", "armes"]).optional().catch(undefined),
});

const TITLE = "Boutique cosplay Sénégal — Animé, Marvel, DC, Jeux vidéo | NDC COSPLAY";
const DESC =
  "Découvrez nos cosplays sur mesure à Dakar : animé, Marvel, DC Comics, jeux vidéo, armes et accessoires. Prix en FCFA, délai de fabrication affiché.";

export const Route = createFileRoute("/boutique")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]),
  component: Shop,
});

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function Shop() {
  const { cat } = Route.useSearch();
  const navigate = useNavigate({ from: "/boutique" });
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = norm(q.trim());
    return products.filter((p) => {
      if (cat === "armes") {
        if (p.weapon_only_price == null && p.accessories_only_price == null) return false;
      } else if (cat && p.category !== cat) return false;
      if (!term) return true;
      return norm(`${p.name} ${p.universe} ${p.description}`).includes(term);
    });
  }, [products, cat, q]);

  const tabs = [
    { key: undefined, label: "Tous" },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">ショップ</p>
      <h1 className="font-display mt-1 text-5xl md:text-7xl">Boutique</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Tous nos cosplays sont fabriqués sur mesure dans notre atelier à Dakar.
      </p>

      <div className="sticky top-16 z-30 -mx-4 mt-8 space-y-4 bg-background/90 px-4 py-4 backdrop-blur-md">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un personnage, un univers…"
            className="field !py-3.5 !pl-11 text-base"
            aria-label="Rechercher un cosplay"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Effacer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <button
              key={t.label}
              className="chip shrink-0"
              data-active={cat === t.key}
              onClick={() => navigate({ search: { cat: t.key } })}
            >
              {t.label}
            </button>
          ))}
          <button
            className="chip shrink-0 !border-accent"
            data-active={cat === "armes"}
            onClick={() => navigate({ search: { cat: "armes" } })}
          >
            <Swords className="h-4 w-4" /> Armes & accessoires uniquement
          </button>
        </div>
      </div>

      {cat === "armes" && (
        <div className="mt-4 border-2 border-accent bg-accent/15 p-4 text-sm">
          Vous avez déjà votre costume ? Commandez seulement l'arme ou les accessoires de votre
          personnage.
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            {results.length} cosplay{results.length > 1 ? "s" : ""}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {results.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  mode={
                    cat === "armes"
                      ? p.weapon_only_price != null
                        ? "armes"
                        : "accessoires"
                      : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {results.length === 0 && (
        <div className="mt-10 border-2 border-dashed border-border p-10 text-center">
          <p className="font-display text-3xl">Cosplays à venir</p>
          <p className="mt-2 text-muted-foreground">
            Les cosplays arrivent bientôt. Contacte-nous sur WhatsApp pour une commande sur mesure.
          </p>
          <a
            href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(q ? `Bonjour NDC COSPLAY, je cherche un cosplay de : ${q}` : "Bonjour NDC COSPLAY, je souhaite commander un cosplay sur mesure")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-manga mt-6"
          >
            Demander un devis sur WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
