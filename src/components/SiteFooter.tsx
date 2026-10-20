import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const phone = s?.whatsapp ?? "221761766899";
  const isAdminPage = pathname.startsWith("/admin");
  return (
    <footer className="relative z-10 mt-24 border-t-2 border-foreground bg-ink halftone">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">
            NDC <span className="text-primary">COSPLAY</span>
          </p>
          <p className="mt-2 text-muted-foreground">La référence du cosplay au Sénégal.</p>
          <p className="font-jp mt-4 text-sakura">あなたの「好き」を、形にする。</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Contact
          </p>
          <ul className="space-y-3">
            <li>
              <a
                className="flex items-center gap-2 hover:text-accent"
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon className="h-5 w-5" /> +221 76 176 68 99
              </a>
            </li>
            {mounted && s?.instagram && (
              <li>
                <a
                  className="flex items-center gap-2 hover:text-sakura"
                  href={`https://instagram.com/${s.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <InstagramIcon className="h-5 w-5" /> @{s.instagram}
                </a>
              </li>
            )}
            {mounted && s?.tiktok && (
              <li>
                <a
                  className="flex items-center gap-2 hover:text-foreground"
                  href={`https://tiktok.com/@${s.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <TikTokIcon className="h-5 w-5" /> TikTok
                </a>
              </li>
            )}
            {mounted && s?.email && (
              <li>
                <a
                  className="flex items-center gap-2 hover:text-primary"
                  href={`mailto:${s.email}`}
                >
                  <Mail className="h-5 w-5" /> {s.email}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Infos
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/boutique" className="hover:text-primary">
                Boutique
              </Link>
            </li>
            <li>
              <Link to="/suivi" className="hover:text-primary">
                Suivre ma commande
              </Link>
            </li>
            <li>
              <Link to="/livraison" className="hover:text-primary">
                Livraison & zones
              </Link>
            </li>
            <li>
              <Link to="/cgv" className="hover:text-primary">
                Conditions générales de vente
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div
        suppressHydrationWarning
        className="border-t border-border py-5 px-4 text-center text-xs text-muted-foreground"
      >
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            © {new Date().getFullYear()} NDC COSPLAY — Création de cosplay sur mesure · Dakar,
            Sénégal
          </span>
          {!isAdminPage && (
            <>
              <span className="hidden sm:inline text-muted-foreground/40">·</span>
              <Link
                to="/admin"
                className="text-[11px] sm:text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                Admin
              </Link>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
