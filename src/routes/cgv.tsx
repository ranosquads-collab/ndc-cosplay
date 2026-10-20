import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Conditions générales de vente | NDC COSPLAY";
const DESC =
  "Conditions générales de vente de NDC COSPLAY : commande, acompte, fabrication sur mesure, livraison et retours.";

export const Route = createFileRoute("/cgv")({
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
  component: CGV,
});

const SECTIONS = [
  [
    "Commande",
    "Toute commande passée sur le site est confirmée avec NDC COSPLAY par WhatsApp. Un numéro de commande unique (NDC-XXXX) lui est attribué.",
  ],
  [
    "Prix",
    "Les prix sont indiqués en francs CFA (FCFA). Le prix final dépend des options choisies (arme, accessoires). Certains prix sont établis sur demande, sur WhatsApp.",
  ],
  [
    "Paiement",
    "Le paiement se règle sur WhatsApp : moitié à la commande, totalité à la commande ou à la livraison, selon votre choix. Tout acompte versé n'est pas remboursable une fois la fabrication lancée, car les matériaux sont achetés et découpés spécialement pour vous.",
  ],
  [
    "Fabrication sur mesure",
    "Chaque cosplay est unique et fabriqué à la main. Le délai indiqué sur chaque fiche est une estimation. Des légères différences avec les photos peuvent exister.",
  ],
  [
    "Mesures",
    "Le client est responsable de l'exactitude des mesures fournies. En cas de doute, cochez « Je ne suis pas sûr(e) de ma taille » : nous vous accompagnons.",
  ],
  [
    "Paiement du solde",
    "Le solde est réglé à la livraison ou au retrait, avant la remise du cosplay.",
  ],
  [
    "Retouches",
    "Une retouche mineure est offerte dans les 7 jours suivant la réception si le cosplay ne correspond pas aux mesures convenues.",
  ],
  ["Contact", "Pour toute question : WhatsApp +221 76 176 68 99 ou pascaldossou7@gmail.com."],
];

function CGV() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-6xl">Conditions générales de vente</h1>
      <div className="mt-10 space-y-8">
        {SECTIONS.map(([t, p], i) => (
          <section key={t} className={i === 2 ? "border-l-4 border-primary bg-card p-5" : ""}>
            <h2 className="text-xl font-bold">
              {i + 1}. {t}
            </h2>
            <p className="mt-2 text-muted-foreground">{p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
