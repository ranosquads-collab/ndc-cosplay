import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { formatPrice } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";
import { settingsQuery } from "@/lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";

interface LastOrder {
  number: string;
  total: number | null;
  product: string;
  phone: string;
  message: string;
}

export const Route = createFileRoute("/commande-confirmee")({
  head: () => ({
    meta: [
      { title: "Commande enregistrée | NDC COSPLAY" },
      { name: "description", content: "Votre commande NDC COSPLAY est enregistrée." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: Confirmation,
});

function readLastOrder(): LastOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("ndc_last_order");
    if (!raw) return null;
    const o = JSON.parse(raw) as LastOrder;
    return o && typeof o.number === "string" ? o : null;
  } catch {
    return null;
  }
}

function Confirmation() {
  const navigate = useNavigate();
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const last = readLastOrder();
    if (!last) {
      navigate({ to: "/boutique" });
    } else {
      setOrder(last);
    }
  }, [navigate]);

  const copy = async () => {
    if (!order) return;
    await navigator.clipboard.writeText(order.message);
    setCopied(true);
    toast.success("Message copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-jp text-sm tracking-[0.3em] text-sakura">ありがとう</p>
        <h1 className="font-display mt-2 text-5xl md:text-6xl">Commande enregistrée !</h1>
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">ありがとう</p>
      <h1 className="font-display mt-2 text-5xl md:text-6xl">Commande enregistrée !</h1>
      <div className="manga-panel mx-auto mt-8 max-w-md bg-card p-6 text-left">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Numéro de commande</p>
        <p className="font-display mt-1 text-4xl text-primary">{order.number}</p>
        <p className="mt-3 text-sm">
          <strong>{order.product}</strong>
        </p>
        <p className="text-sm text-muted-foreground">Total : {formatPrice(order.total)}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Gardez ce numéro : il vous permet de suivre votre commande. Le paiement se règle sur
          WhatsApp.
        </p>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Si WhatsApp ne s'est pas ouvert, utilisez le bouton ci-dessous ou copiez le message.
      </p>
      <pre className="mx-auto mt-4 max-h-56 max-w-md overflow-auto whitespace-pre-wrap border border-border bg-secondary p-3 text-left text-xs">
        {order.message}
      </pre>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={waLink(settings.whatsapp, order.message)}
          target="_blank"
          rel="noreferrer"
          className="btn-teal"
        >
          <WhatsAppIcon className="h-5 w-5" /> Ouvrir WhatsApp
        </a>
        <button type="button" onClick={copy} className="btn-ghost-manga">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copier le message
        </button>
      </div>
      <Link to="/suivi" search={{ number: order.number }} className="btn-manga mt-6">
        <Search className="h-4 w-4" /> Suivre ma commande
      </Link>
    </div>
  );
}
