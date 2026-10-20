import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SIZE_CHART } from "@/lib/content";
import { Ruler } from "lucide-react";

function BodyFigure() {
  return (
    <svg viewBox="0 0 200 320" className="mx-auto h-64 w-auto" aria-label="Schéma des mesures">
      <g fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
        <circle cx="100" cy="35" r="20" />
        <path d="M70 70 Q100 60 130 70 L145 150 L135 152 L125 100 L122 170 Q130 230 128 300 L108 300 L100 200 L92 300 L72 300 Q70 230 78 170 L75 100 L65 152 L55 150 Z" />
      </g>
      <g strokeWidth="2.5" strokeDasharray="5 4" className="text-primary" stroke="currentColor">
        <line x1="62" y1="98" x2="138" y2="98" />
        <line x1="74" y1="132" x2="126" y2="132" />
        <line x1="72" y1="168" x2="128" y2="168" />
      </g>
      <g className="text-accent" stroke="currentColor" strokeWidth="2.5">
        <line x1="170" y1="15" x2="170" y2="300" />
        <line x1="164" y1="15" x2="176" y2="15" />
        <line x1="164" y1="300" x2="176" y2="300" />
      </g>
      <g fontSize="11" fontWeight="700" fill="currentColor" className="text-foreground">
        <text x="2" y="102">
          Poitrine
        </text>
        <text x="10" y="136">
          Taille
        </text>
        <text x="2" y="172">
          Hanches
        </text>
        <text x="150" y="160" transform="rotate(-90 178 160)">
          Hauteur
        </text>
      </g>
    </svg>
  );
}

export function SizeGuide() {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-4 hover:text-sakura">
        <Ruler className="h-4 w-4" /> Comment prendre mes mesures ?
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-2 border-foreground bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Guide des mesures</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <BodyFigure />
          <ul className="space-y-3 text-sm">
            <li>
              <strong className="text-primary">Poitrine :</strong> mètre ruban à l'horizontale, sous
              les aisselles, sur la partie la plus forte.
            </li>
            <li>
              <strong className="text-primary">Taille :</strong> au creux de la taille, au-dessus du
              nombril, sans serrer.
            </li>
            <li>
              <strong className="text-primary">Hanches :</strong> sur la partie la plus large des
              fesses, pieds joints.
            </li>
            <li>
              <strong className="text-accent">Hauteur :</strong> pieds nus, dos contre un mur, du
              sol au sommet de la tête.
            </li>
            <li className="text-muted-foreground">
              Astuce : portez des vêtements fins et faites-vous aider par quelqu'un. Mesures en
              centimètres.
            </li>
          </ul>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-2 border-foreground text-center text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">
              Correspondance des tailles adultes (cm)
            </caption>
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["Taille", "Poitrine", "Taille", "Hanches", "Hauteur"].map((h, i) => (
                  <th key={i} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.size} className="border-t border-border odd:bg-secondary">
                  <td className="py-2 font-bold">{r.size}</td>
                  <td>{r.poitrine}</td>
                  <td>{r.taille}</td>
                  <td>{r.hanches}</td>
                  <td>{r.hauteur}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Enfants : indiquez de préférence vos propres mesures ou l'âge dans l'adresse/notes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
