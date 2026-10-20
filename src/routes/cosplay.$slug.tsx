import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Clock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { OrderForm } from "@/components/OrderForm";
import { ShareButton } from "@/components/ShareButton";
import { formatPrice } from "@/lib/pricing";
import { CATEGORIES, productQuery, settingsQuery } from "@/lib/queries";
import type { CategoryKey } from "@/lib/types";

export const Route = createFileRoute("/cosplay/$slug")({
  validateSearch: z.object({
    mode: z
      .enum(["cosplay", "armes", "accessoires", "armes_accessoires"])
      .optional()
      .catch(undefined),
  }),
  loader: async ({ context, params }) => {
    const [product] = await Promise.all([
      context.queryClient.ensureQueryData(productQuery(params.slug)),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    if (!product) throw notFound();
    return {
      name: product.name,
      universe: product.universe,
      price: product.base_price,
      description: product.description,
    };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `Cosplay ${loaderData.name} sur mesure — ${loaderData.universe} | NDC COSPLAY Dakar`
      : "Cosplay | NDC COSPLAY";
    const desc = loaderData
      ? `Cosplay ${loaderData.name} fabriqué sur mesure au Sénégal, ${formatPrice(loaderData.price)}. ${loaderData.description}`
      : "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Cosplay introuvable</h1>
      <Link to="/boutique" className="btn-manga mt-6">
        Retour à la boutique
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { mode } = Route.useSearch();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const [active, setActive] = useState(0);
  if (!product) return null;
  const cat = CATEGORIES.find((c) => c.key === product.category);
  const hasImages = product.images.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <Link
        to="/boutique"
        search={{ cat: product.category as CategoryKey }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {cat?.label}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Galerie */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="manga-panel relative aspect-[4/5] overflow-hidden bg-card">
            {hasImages ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={product.images[active]}
                  alt={`Cosplay ${product.name} — photo ${active + 1}`}
                  width={800}
                  height={1000}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
            ) : (
              <div className="halftone flex h-full w-full items-center justify-center bg-ink p-6">
                <span className="font-display text-center text-3xl leading-tight text-primary md:text-4xl">
                  {product.name}
                </span>
              </div>
            )}
            <span className="font-jp absolute right-3 top-3 text-sm text-sakura [writing-mode:vertical-rl]">
              {cat?.jp}
            </span>
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-20 w-16 overflow-hidden border-2 transition-all ${i === active ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos + formulaire */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            {product.universe}
          </p>
          <h1 className="font-display mt-1 text-4xl md:text-6xl">{product.name}</h1>
          <p className="mt-3 font-display text-3xl text-primary">
            {product.base_price != null && (
              <span className="mr-2 font-sans text-sm text-muted-foreground">à partir de</span>
            )}
            {formatPrice(product.base_price)}
          </p>
          <p className="mt-4 text-muted-foreground">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {product.production_days != null && (
              <span className="inline-flex items-center gap-1.5 border-2 border-border px-3 py-1.5">
                <Clock className="h-4 w-4 text-sakura" /> Fabrication : ~{product.production_days}{" "}
                jours
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 border-2 border-border px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" /> Sur mesure
            </span>
            <ShareButton
              title={`Cosplay ${product.name} — NDC COSPLAY`}
              text={`Regarde ce cosplay ${product.name} 🔥`}
            />
          </div>
          <div className="my-8 h-0.5 bg-gradient-to-r from-primary via-sakura to-transparent" />
          <OrderForm product={product} settings={settings} initialMode={mode} />
        </div>
      </div>
    </div>
  );
}
