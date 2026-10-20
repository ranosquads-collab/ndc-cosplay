export const SERVICES = [
  {
    title: "Confection sur mesure",
    text: "Chaque costume est taillé à vos mesures, pièce par pièce.",
    jp: "仕立て",
  },
  {
    title: "Matériaux de qualité",
    text: "Tissus respirants, mousse EVA, cuir synthétique : solides et confortables.",
    jp: "素材",
  },
  {
    title: "Finitions soignées",
    text: "Broderies, peinture, patine : les détails qui font la différence.",
    jp: "仕上げ",
  },
  {
    title: "Livraison sécurisée",
    text: "Emballage protégé, livraison à Dakar et dans tout le Sénégal.",
    jp: "配送",
  },
];

export const STEPS = [
  { n: "01", title: "Choisissez", text: "Trouvez votre cosplay dans la boutique et vos options." },
  {
    n: "02",
    title: "Vos mesures",
    text: "Taille standard ou vos propres mesures, guide à l'appui.",
  },
  { n: "03", title: "Commandez", text: "Votre commande est envoyée sur WhatsApp avec son numéro." },
  {
    n: "04",
    title: "Paiement & fabrication",
    text: "On valide ensemble le paiement sur WhatsApp, on crée.",
  },
  { n: "05", title: "Livraison", text: "Recevez votre cosplay prêt pour la convention." },
];

export const FAQ = [
  {
    q: "Combien de temps faut-il pour fabriquer un cosplay ?",
    a: "Le délai estimé est indiqué sur chaque fiche cosplay. Il est confirmé avec vous sur WhatsApp.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le paiement se règle directement sur WhatsApp : moitié à la commande, totalité à la commande ou à la livraison, selon ce que vous préférez.",
  },
  {
    q: "Je ne connais pas ma taille, que faire ?",
    a: "Cochez « Je ne suis pas sûr(e) de ma taille » dans le formulaire : le créateur vous contactera pour prendre vos mesures ensemble.",
  },
  {
    q: "Pouvez-vous créer un personnage qui n'est pas dans la boutique ?",
    a: "Oui ! Envoyez-nous une photo du personnage sur WhatsApp et nous vous ferons un devis.",
  },
  {
    q: "Livrez-vous hors de Dakar ?",
    a: "Oui, partout au Sénégal. Le tarif et le délai de livraison sont confirmés sur WhatsApp lors de la commande.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Rendez-vous sur la page « Suivre ma commande » avec votre numéro de commande (NDC-XXXX) et votre numéro de téléphone.",
  },
];

export const SIZE_CHART = [
  { size: "XS", poitrine: "78-82", taille: "62-66", hanches: "84-88", hauteur: "150-158" },
  { size: "S", poitrine: "83-88", taille: "67-72", hanches: "89-94", hauteur: "158-165" },
  { size: "M", poitrine: "89-96", taille: "73-80", hanches: "95-102", hauteur: "165-172" },
  { size: "L", poitrine: "97-104", taille: "81-88", hanches: "103-110", hauteur: "172-178" },
  { size: "XL", poitrine: "105-112", taille: "89-96", hanches: "111-118", hauteur: "178-184" },
  { size: "XXL", poitrine: "113-120", taille: "97-106", hanches: "119-126", hauteur: "184-190" },
  { size: "XXXL", poitrine: "121-130", taille: "107-118", hanches: "127-136", hauteur: "188-195" },
];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const GENDERS = ["Homme", "Femme", "Enfant"] as const;
export const MEASURES = [
  { key: "poitrine", label: "Tour de poitrine" },
  { key: "taille", label: "Tour de taille" },
  { key: "hanches", label: "Tour de hanches" },
  { key: "hauteur", label: "Hauteur totale" },
  { key: "epaules", label: "Largeur d'épaules" },
  { key: "bras", label: "Longueur de bras" },
  { key: "entrejambe", label: "Entrejambe" },
] as const;
