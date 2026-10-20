import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Gem, Ruler, Scissors, Swords, Truck, Mail } from "lucide-react";
import { MangaBubbles } from "@/components/MangaBubbles";
import { ShareButton } from "@/components/ShareButton";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ, SERVICES, STEPS } from "@/lib/content";
import { CATEGORIES, homeImagesQuery, settingsQuery } from "@/lib/queries";
import type { CategoryKey } from "@/lib/types";

const TITLE = "NDC COSPLAY — Cosplay sur mesure au Sénégal | Dakar";
const DESC =
  "La référence du cosplay au Sénégal. Création de cosplay sur mesure à Dakar : animé, Marvel, DC, jeux vidéo, armes et accessoires. Commande facile via WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      {
        name: "keywords",
        content:
          "cosplay Sénégal, cosplay sur mesure Dakar, costume anime Dakar, cosplay Marvel, cosplay DC",
      },
      { property: "og:title", content: TITLE },
{
  property: "og:description",
  content:
    "Plus qu'un cosplay… une identité ! Création de cosplay sur mesure à Dakar.",
},
{ property: "og:type", content: "website" },
{ property: "og:url", content: "https://ndc-cosplay.vercel.app/" },
{
  property: "og:image",
  content: "https://ndc-cosplay.vercel.app/ndc-logo.png",
},
{ property: "og:image:width", content: "1536" },
{ property: "og:image:height", content: "1024" },
{ name: "twitter:card", content: "summary_large_image" },
{
  name: "twitter:title",
  content: TITLE,
},
{
  name: "twitter:description",
  content:
    "Plus qu'un cosplay… une identité ! Création de cosplay sur mesure à Dakar.",
},
{
  name: "twitter:image",
  content: "https://ndc-cosplay.vercel.app/ndc-logo.png",
},
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(homeImagesQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]),
  component: Home,
});

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6 },
};

function SectionTitle({ jp, title, sub }: { jp: string; title: string; sub?: string }) {
  return (
    <motion.div {...fadeUp} className="mb-10 text-center md:mb-14">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">{jp}</p>
      <h2 className="font-display mt-2 text-4xl md:text-5xl">
        <span className="ink-underline">{title}</span>
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

const ARMES_CARD = {
  key: "armes",
  label: "Armes & accessoires",
  sub: "Sans le costume",
  jp: "武器",
} as const;

function Home() {
  const { data: images } = useSuspenseQuery(homeImagesQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const hero = images.find((i) => i.kind === "hero")?.url ?? null;
  const carousel = images.filter((i) => i.kind === "carousel");
  const gallery = images.filter((i) => i.kind === "gallery");
  const categoryImage = (key: CategoryKey | "armes") =>
    images.find((i) => i.kind === "category" && i.category_key === key)?.url ?? null;
  const icons = [Scissors, Gem, Ruler, Truck];
  const cards = [
    ...CATEGORIES.map((c) => ({ ...c, to: "/boutique" as const, search: { cat: c.key } })),
    { ...ARMES_CARD, to: "/boutique" as const, search: { cat: "armes" as const } },
  ];

  return (
    <>
      {/* HÉROS */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden border-b-2 border-foreground">
        {hero ? (
          <img
            src={hero}
            alt="Cosplay sur mesure par NDC COSPLAY"
            width={1600}
            height={1008}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]"
          />
        ) : (
          <div
            aria-hidden
            className="halftone absolute inset-0 -z-20"
            style={{ background: "linear-gradient(135deg, var(--ink) 0%, var(--primary) 160%)" }}
          />
        )}
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-side)" }} />
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-fade)" }} />
        <MangaBubbles />
        <span
          aria-hidden
          className="font-jp absolute right-3 top-1/2 hidden -translate-y-1/2 text-lg tracking-[0.4em] text-foreground/40 [writing-mode:vertical-rl] lg:block"
        >
          あなたの「好き」を、形にする。
        </span>
        <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-20">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block bg-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground"
          >
            La référence du cosplay au Sénégal
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display mt-5 text-6xl leading-[0.9] sm:text-7xl md:text-8xl lg:text-9xl"
          >
            NDC
            <br />
            <span className="text-primary">COSPLAY</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-md text-xl font-semibold md:text-2xl"
          >
            Création de cosplay sur mesure
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 max-w-md text-lg italic text-sakura"
          >
            Plus qu'un cosplay… une identité !
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link to="/boutique" className="btn-manga">
              Voir la boutique <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost-manga"
            >
              <WhatsAppIcon className="h-4 w-4" /> Demander un devis
            </a>
          </motion.div>
          <div className="mt-6">
            <ShareButton title="NDC COSPLAY" text="La référence du cosplay au Sénégal 🎌" />
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <SectionTitle jp="カテゴリー" title="Choisis ton univers" />
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-5">
          {cards.map((c, i) => {
            const img = categoryImage(c.key);
            return (
              <motion.div
                key={c.key}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={c.key === "armes" ? "col-span-2 lg:col-span-1" : ""}
              >
                <Link
                  to={c.to}
                  search={c.search}
                  className="group manga-panel manga-panel-hover relative block aspect-[3/4] overflow-hidden bg-card"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={`Cosplay ${c.label}`}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="halftone flex h-full w-full items-center justify-center p-4"
                      style={{
                        background: "linear-gradient(160deg, var(--ink) 30%, var(--primary) 190%)",
                      }}
                    >
                      <span className="font-display text-center text-3xl leading-tight text-primary md:text-4xl">
                        {c.label}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <span className="font-jp absolute right-2 top-2 text-xs text-sakura [writing-mode:vertical-rl]">
                    {c.jp}
                  </span>
                  {c.key === "armes" && (
                    <Swords className="absolute left-2 top-2 h-5 w-5 text-accent" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-5">
                    <h3 className="font-display text-2xl md:text-4xl">{c.label}</h3>
                    <p className="text-xs text-muted-foreground md:text-sm">{c.sub}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-primary transition-all group-hover:gap-2">
                      Explorer <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CARROUSEL */}
      {carousel.length > 0 && (
        <section
          aria-label="Nos cosplays"
          className="relative overflow-hidden border-y-2 border-foreground bg-primary py-6"
        >
          <div className="marquee flex w-max gap-4">
            {[...carousel, ...carousel].map((img, i) => (
              <figure
                key={i}
                className="relative h-56 w-44 shrink-0 overflow-hidden border-2 border-ink md:h-72 md:w-56"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover"
                />
                <figcaption className="font-display absolute bottom-0 left-0 bg-ink px-2 py-0.5 text-sm">
                  {img.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <SectionTitle
          jp="サービス"
          title="Nos services"
          sub="Un savoir-faire artisanal, au service de votre personnage préféré."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => {
            const Icon = icons[i] ?? Scissors;
            return (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="manga-panel manga-panel-hover halftone relative bg-card p-6"
              >
                <span className="font-jp absolute right-4 top-4 text-2xl text-foreground/10">
                  {s.jp}
                </span>
                <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* COMMENT COMMANDER */}
      <section className="speedlines border-y-2 border-foreground bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle jp="注文方法" title="Comment commander" />
          <ol className="grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative border-2 border-foreground bg-background p-5"
              >
                <span className="font-display text-5xl text-primary">{s.n}</span>
                <h3 className="mt-2 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* RÉALISATIONS */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionTitle
            jp="作品"
            title="Nos réalisations"
            sub="Quelques créations sorties de l'atelier NDC."
          />
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
            {gallery.map((g, i) => (
              <motion.figure
                key={g.id}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`group relative overflow-hidden border-2 border-foreground ${i === 0 ? "col-span-2 row-span-2" : ""} ${i === 3 ? "md:row-span-2" : ""}`}
              >
                <img
                  src={g.url}
                  alt={`Réalisation NDC : ${g.caption}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute bottom-2 left-2 bg-ink/85 px-2 py-0.5 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                  {g.caption}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 md:pb-28">
        <SectionTitle jp="よくある質問" title="Questions fréquentes" />
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ.map((f, i) => (
            <AccordionItem
              key={i}
              value={`q${i}`}
              className="border-2 border-foreground bg-card px-4"
            >
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-7xl px-4">
        <motion.div
          {...fadeUp}
          className="manga-panel relative overflow-hidden bg-primary p-8 text-primary-foreground md:p-14"
        >
          <span
            aria-hidden
            className="font-jp absolute -right-4 -top-6 text-[7rem] leading-none text-ink/15 md:text-[10rem]"
          >
            好き
          </span>
          <h2 className="font-display text-4xl md:text-6xl">Un personnage en tête ?</h2>
          <p className="mt-3 max-w-lg text-lg">
            Envoie-nous une photo, on s'occupe du reste. Devis gratuit sur WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-teal"
            >
              <WhatsAppIcon className="h-5 w-5" /> +221 76 176 68 99
            </a>
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost-manga"
              >
                <InstagramIcon className="h-5 w-5" /> Instagram
              </a>
            )}
            {settings.tiktok && (
              <a
                href={`https://tiktok.com/@${settings.tiktok}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost-manga"
              >
                <TikTokIcon className="h-5 w-5" /> TikTok
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="btn-ghost-manga">
                <Mail className="h-5 w-5" /> E-mail
              </a>
            )}
          </div>
        </motion.div>
      </section>
    </>
  );
}
