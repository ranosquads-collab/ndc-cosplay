import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { settingsQuery } from "@/lib/queries";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/boutique", label: "Boutique" },
  { to: "/suivi", label: "Suivi" },
  { to: "/livraison", label: "Livraison" },
] as const;

export function SiteHeader() {
  const { data: s } = useQuery(settingsQuery);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const wa = `https://wa.me/${s?.whatsapp ?? "221761766899"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          {s?.logo_url ? (
            <img
              src={s.logo_url}
              alt={s.logo_text || "NDC COSPLAY"}
              className="h-9 w-auto max-w-40 object-contain"
            />
          ) : (
            <>
              <span className="font-display text-2xl leading-none text-foreground">
                {s?.logo_text || (
                  <>
                    NDC <span className="text-primary">COSPLAY</span>
                  </>
                )}
              </span>
              <span className="font-jp hidden text-[10px] text-sakura sm:inline">コスプレ</span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {s?.instagram && (
            <a
              href={`https://instagram.com/${s.instagram}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hidden p-2 text-muted-foreground hover:text-sakura sm:block"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
          {s?.tiktok && (
            <a
              href={`https://tiktok.com/@${s.tiktok}`}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="hidden p-2 text-muted-foreground hover:text-foreground sm:block"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          )}
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="btn-teal !px-3 !py-2 text-xs"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button className="p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="font-display block py-3 text-2xl"
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-4 text-muted-foreground">
            {mounted && s?.instagram && (
              <a
                href={`https://instagram.com/${s.instagram}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-6 w-6" />
              </a>
            )}
            {mounted && s?.tiktok && (
              <a
                href={`https://tiktok.com/@${s.tiktok}`}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
