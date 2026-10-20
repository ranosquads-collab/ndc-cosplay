import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { formatPrice, type OrderMode } from "@/lib/pricing";
import { CATEGORIES, type Product } from "@/lib/queries";

export function ProductCard({
  product,
  mode,
  index = 0,
}: {
  product: Product;
  mode?: OrderMode | undefined;
  index?: number;
}) {
  const cat = CATEGORIES.find((c) => c.key === product.category);
  const price =
    mode === "armes"
      ? product.weapon_only_price
      : mode === "accessoires"
        ? product.accessories_only_price
        : product.base_price;
  const image = product.images[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to="/cosplay/$slug"
        params={{ slug: product.slug }}
        search={mode ? { mode } : {}}
        className="group manga-panel manga-panel-hover block bg-card"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-foreground">
          {image ? (
            <img
              src={image}
              alt={`Cosplay ${product.name}`}
              loading="lazy"
              width={800}
              height={1000}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="halftone flex h-full w-full items-center justify-center bg-ink p-4">
              <span className="font-display text-center text-2xl leading-tight text-primary">
                {product.name}
              </span>
            </div>
          )}
          <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
            {cat?.label}
          </span>
          {mode && (
            <span className="absolute right-2 top-2 bg-accent px-2 py-1 text-[11px] font-bold uppercase text-accent-foreground">
              {mode === "armes" ? "Arme" : "Accessoires"}
            </span>
          )}
        </div>
        <div className="p-3 md:p-4">
          <p className="text-xs text-muted-foreground">{product.universe}</p>
          <h3 className="mt-0.5 line-clamp-1 text-base font-bold md:text-lg">{product.name}</h3>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="font-display text-lg text-primary">
              {price != null && (
                <span className="mr-1 font-sans text-[11px] text-muted-foreground">dès</span>
              )}
              {formatPrice(price)}
            </p>
            {product.production_days != null && (
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <Clock className="h-3 w-3" /> {product.production_days} j
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
