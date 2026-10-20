import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Swords,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  adminCheckAuth,
  adminDeleteHomeImage,
  adminDeleteOrder,
  adminDeletePhotoFile,
  adminDeleteProduct,
  adminDuplicateProduct,
  adminGetHomeImages,
  adminGetOrders,
  adminGetProducts,
  adminLogin,
  adminLogout,
  adminReorderHomeImages,
  adminSaveHomeImage,
  adminSaveProduct,
  adminToggleProductActive,
  adminUpdateOrderNotes,
  adminUpdateOrderPayment,
  adminUpdateOrderStatus,
  adminUpdateSettings,
} from "@/lib/admin.functions";
import { getSettings } from "@/lib/data.functions";
import { createClientOnlyFn } from "@tanstack/react-start";
import { formatPrice } from "@/lib/pricing";
import {
  CATEGORIES,
  type CategoryKey,
  type DeliveryZone,
  type HomeImage,
  type Order,
  type OrderStatus,
  type PaymentReceived,
  type Product,
  type Settings,
} from "@/lib/types";
import { WhatsAppIcon } from "@/components/icons";
const uploadCompressedPhoto = createClientOnlyFn(async (file: File): Promise<string> => {
  const blobUpload = await import("@/lib/blob-upload.client");
  return blobUpload.uploadCompressedPhoto(file);
});

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — NDC COSPLAY" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const ALL_CATEGORIES = [
  ...CATEGORIES,
  { key: "armes" as const, label: "Armes & accessoires", sub: "Sans costume", jp: "武器" },
];

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [tab, setTab] = useState<"orders" | "products" | "visuals" | "settings">("orders");

  // Vérification de la session au montage
  useEffect(() => {
    adminCheckAuth()
      .then((res) => {
        setAuthed(res.authenticated);
        if (res.email) setAdminEmail(res.email);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLoginForm
        onSuccess={(email) => {
          setAuthed(true);
          setAdminEmail(email);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Barre supérieure Admin */}
      <header className="sticky top-16 z-30 border-b-2 border-foreground bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl sm:text-2xl text-primary">ADMIN NDC</span>
            <span className="hidden rounded bg-ink px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {adminEmail}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="btn-ghost-manga !px-3 !py-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voir le site</span>
            </Link>
            <button
              onClick={async () => {
                await adminLogout();
                setAuthed(false);
                toast.success("Déconnexion réussie");
              }}
              className="btn-ghost-manga !px-3 !py-1.5 text-xs !text-destructive"
              title="Déconnexion"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        {/* Onglets de navigation adaptés mobile */}
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          <button
            onClick={() => setTab("orders")}
            className="chip shrink-0 !py-2 text-xs font-bold"
            data-active={tab === "orders"}
          >
            <Package className="h-4 w-4" /> Commandes
          </button>
          <button
            onClick={() => setTab("products")}
            className="chip shrink-0 !py-2 text-xs font-bold"
            data-active={tab === "products"}
          >
            <ShoppingBag className="h-4 w-4" /> Produits
          </button>
          <button
            onClick={() => setTab("visuals")}
            className="chip shrink-0 !py-2 text-xs font-bold"
            data-active={tab === "visuals"}
          >
            <ImageIcon className="h-4 w-4" /> Photos & Visuels
          </button>
          <button
            onClick={() => setTab("settings")}
            className="chip shrink-0 !py-2 text-xs font-bold"
            data-active={tab === "settings"}
          >
            <SettingsIcon className="h-4 w-4" /> Paramètres
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-7xl px-4 pt-6">
        {tab === "orders" && <OrdersSection />}
        {tab === "products" && <ProductsSection />}
        {tab === "visuals" && <VisualsSection />}
        {tab === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}

// ===========================================================================
// FORMULAIRE DE CONNEXION ADMIN
// ===========================================================================

function AdminLoginForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await adminLogin({ data: { email, password } });
      if (res.ok) {
        toast.success("Bienvenue dans l'espace vendeur");
        onSuccess(email);
      } else {
        setErrorMsg(res.message);
        toast.error(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="manga-panel w-full max-w-md bg-card p-6 md:p-8">
        <div className="text-center">
          <p className="font-jp text-sm tracking-[0.3em] text-sakura">管理者</p>
          <h1 className="font-display mt-2 text-3xl md:text-4xl text-primary">Espace Vendeur</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Accès sécurisé réservé au responsable de la boutique.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 border-2 border-destructive bg-destructive/15 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="votre@email.com"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="••••••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-manga w-full justify-center !py-3"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            Connexion
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Session sécurisée par cookie signé. Blocage automatique de 15 minutes après 5 échecs.
        </p>
      </div>
    </div>
  );
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Supprimer",
  loading = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="manga-panel relative w-full max-w-md bg-card p-6 text-left">
        <div className="flex items-start justify-between gap-4">
          <h4 className="font-display text-2xl text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5 shrink-0" />
            {title}
          </h4>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="btn-ghost-manga !py-2 text-xs"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="btn-manga !bg-destructive !text-destructive-foreground !py-2 text-xs"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SECTION 1 : COMMANDES
// ===========================================================================

function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetOrders({ data: { status: filter } });
      setOrders(res);
    } catch {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Commandes</h2>
          <p className="text-xs text-muted-foreground">
            {orders.length} commande{orders.length > 1 ? "s" : ""} trouvée
            {orders.length > 1 ? "s" : ""}
          </p>
        </div>

        <button onClick={load} disabled={loading} className="btn-ghost-manga !py-2 text-xs">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      {/* Filtres de statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {["all", "nouvelle", "confirmee", "en_fabrication", "prete", "livree"].map((st) => (
          <button
            key={st}
            className="chip shrink-0 text-xs capitalize"
            data-active={filter === st}
            onClick={() => setFilter(st)}
          >
            {st === "all" ? "Toutes" : st.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="manga-panel border-dashed bg-card p-12 text-center text-muted-foreground">
          <Package className="mx-auto h-12 w-12 opacity-30" />
          <p className="mt-3 font-bold">Aucune commande pour le moment</p>
          <p className="text-xs">Les commandes passées par les clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => setSelectedOrder(ord)}
              className="manga-panel cursor-pointer bg-card p-4 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-primary">{ord.order_number}</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
                  {ord.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-2 text-sm font-bold">{ord.product_name}</div>
              <div className="text-xs text-muted-foreground">
                Client : {ord.first_name} {ord.last_name}
              </div>
              <div className="text-xs text-muted-foreground">Tél : {ord.phone}</div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                <span className="font-semibold text-accent">
                  {ord.total == null ? "Prix sur demande" : formatPrice(ord.total)}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    ord.payment_received === "total"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : ord.payment_received === "acompte"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {ord.payment_received === "total"
                    ? "Payé"
                    : ord.payment_received === "acompte"
                      ? "Acompte"
                      : "Non payé"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedOrder(updated);
          }}
          onDeleted={(id) => {
            setOrders((prev) => prev.filter((o) => o.id !== id));
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onUpdated,
  onDeleted,
}: {
  order: Order;
  onClose: () => void;
  onUpdated: (o: Order) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentReceived, setPaymentReceived] = useState<PaymentReceived>(order.payment_received);
  const [notes, setNotes] = useState<string>(order.internal_notes || "");
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cleanPhone = order.phone.replace(/[^\d]/g, "");
  const fullPhone = cleanPhone.startsWith("221") ? cleanPhone : `221${cleanPhone}`;

  const openWhatsApp = (msg: string) => {
    try {
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch {
      // Ignoré si popups bloqués par l'environnement
    }
  };

  const saveStatus = async (newStatus: OrderStatus) => {
    setStatus(newStatus);
    try {
      await adminUpdateOrderStatus({ data: { orderId: order.id, status: newStatus } });
      onUpdated({ ...order, status: newStatus });
      toast.success(`Statut mis à jour : ${newStatus}`);
    } catch {
      toast.error("Erreur de mise à jour");
    }
  };

  const savePayment = async (val: PaymentReceived) => {
    setPaymentReceived(val);
    try {
      await adminUpdateOrderPayment({ data: { orderId: order.id, paymentReceived: val } });
      onUpdated({ ...order, payment_received: val });
      toast.success("Paiement mis à jour");
    } catch {
      toast.error("Erreur paiement");
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await adminUpdateOrderNotes({ data: { orderId: order.id, notes } });
      onUpdated({ ...order, internal_notes: notes });
      toast.success("Notes internes enregistrées");
    } catch {
      toast.error("Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const deleteThisOrder = async () => {
    setDeleting(true);
    try {
      await adminDeleteOrder({ data: { orderId: order.id } });
      toast.success("Commande supprimée avec succès");
      setShowConfirmDelete(false);
      onDeleted(order.id);
    } catch {
      toast.error("Erreur lors de la suppression de la commande");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="manga-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-card p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-3xl text-primary">{order.order_number}</h3>
          <span className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("fr-FR")}
          </span>
        </div>

        {/* Client */}
        <div className="mt-4 rounded border border-border bg-background p-3 text-sm">
          <p className="font-bold text-foreground">
            {order.first_name} {order.last_name}
          </p>
          <p className="text-xs text-muted-foreground">Tél : {order.phone}</p>
          <p className="text-xs text-muted-foreground">Adresse : {order.address}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() =>
                openWhatsApp(
                  `Bonjour ${order.first_name}, NDC COSPLAY à propos de votre commande ${order.order_number}.`,
                )
              }
              className="btn-teal !px-3 !py-1 text-xs"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" /> Écrire au client
            </button>
            <a href={`tel:${order.phone}`} className="btn-ghost-manga !px-3 !py-1 text-xs">
              Appeler
            </a>
          </div>
        </div>

        {/* Détails Produit & Formule */}
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <strong>Cosplay :</strong> {order.product_name}
          </p>
          <p>
            <strong>Formule :</strong> {order.mode} (Arme : {order.with_weapon ? "Oui" : "Non"} |
            Accessoires : {order.with_accessories ? "Oui" : "Non"})
          </p>
          <p>
            <strong>Taille / Mesures :</strong>{" "}
            {order.unsure_size
              ? "Pas sûr(e) (à assister)"
              : order.size ||
                (order.measurements ? JSON.stringify(order.measurements) : "Non spécifié")}
          </p>
          <p>
            <strong>Paiement souhaité :</strong> {order.payment_preference}
          </p>
          <p>
            <strong>Total :</strong>{" "}
            <span className="font-display text-lg text-primary">
              {order.total == null ? "Prix sur demande" : formatPrice(order.total)}
            </span>
          </p>
        </div>

        {/* Statut Commande */}
        <div className="mt-6 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Changer le statut
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["nouvelle", "confirmee", "en_fabrication", "prete", "livree"] as OrderStatus[]).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => saveStatus(st)}
                  className="chip text-xs"
                  data-active={status === st}
                >
                  {st.replace("_", " ")}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Paiement Reçu */}
        <div className="mt-4 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Paiement encaissé (saisie manuelle)
          </label>
          <div className="mt-2 flex gap-2">
            {(["non", "acompte", "total"] as PaymentReceived[]).map((p) => (
              <button
                key={p}
                onClick={() => savePayment(p)}
                className="chip text-xs"
                data-active={paymentReceived === p}
              >
                {p === "non" ? "Non reçu" : p === "acompte" ? "Acompte reçu" : "Totalité reçue"}
              </button>
            ))}
          </div>
        </div>

        {/* Modèles de messages WhatsApp */}
        <div className="mt-4 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Messages modèles WhatsApp
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() =>
                openWhatsApp(
                  `Bonjour ${order.first_name}, votre commande ${order.order_number} pour le cosplay ${order.product_name} est confirmée ! Nous lançons la confection.`,
                )
              }
              className="btn-ghost-manga !px-2.5 !py-1 text-[11px]"
            >
              Commande confirmée
            </button>
            <button
              onClick={() =>
                openWhatsApp(
                  `Bonjour ${order.first_name}, votre cosplay ${order.product_name} (${order.order_number}) est prêt à l'atelier NDC ! Quand seriez-vous disponible pour la livraison ?`,
                )
              }
              className="btn-ghost-manga !px-2.5 !py-1 text-[11px]"
            >
              Cosplay prêt
            </button>
            <button
              onClick={() =>
                openWhatsApp(
                  `Bonjour ${order.first_name}, votre commande ${order.order_number} a bien été livrée. Merci pour votre confiance et à bientôt pour de nouveaux cosplays !`,
                )
              }
              className="btn-ghost-manga !px-2.5 !py-1 text-[11px]"
            >
              Commande livrée
            </button>
          </div>
        </div>

        {/* Notes internes */}
        <div className="mt-4 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Notes internes (vendeur)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="field mt-1 min-h-20 text-xs"
            placeholder="Notes sur les retouches, tissu choisi, date convenue…"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={saveNotes}
              disabled={saving}
              className="btn-manga !px-3 !py-1.5 text-xs"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer les notes"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="btn-ghost-manga !text-destructive !py-1.5 text-xs"
          >
            <Trash2 className="h-4 w-4" /> Supprimer la commande
          </button>
          <button type="button" onClick={onClose} className="btn-ghost-manga !py-1.5 text-xs">
            Fermer
          </button>
        </div>

        <ConfirmModal
          isOpen={showConfirmDelete}
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la commande ${order.order_number} (${order.product_name} — ${order.first_name} ${order.last_name}) ? Cette action est irréversible.`}
          confirmLabel="Oui, supprimer"
          loading={deleting}
          onConfirm={deleteThisOrder}
          onCancel={() => setShowConfirmDelete(false)}
        />
      </div>
    </div>
  );
}

// ===========================================================================
// SECTION 2 : PRODUITS
// ===========================================================================

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetProducts();
      setProducts(res);
    } catch {
      toast.error("Erreur de chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (p: Product) => {
    try {
      await adminToggleProductActive({ data: { productId: p.id, active: !p.active } });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
      toast.success(p.active ? "Produit masqué du site" : "Produit visible sur le site");
    } catch {
      toast.error("Erreur de mise à jour");
    }
  };

  const duplicate = async (p: Product) => {
    try {
      const res = await adminDuplicateProduct({ data: { productId: p.id } });
      setProducts((prev) => [res.product, ...prev]);
      toast.success("Produit dupliqué avec succès");
    } catch {
      toast.error("Erreur de duplication");
    }
  };

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeletingProduct(true);
    try {
      await adminDeleteProduct({ data: { productId: productToDelete.id } });
      setProducts((prev) => prev.filter((x) => x.id !== productToDelete.id));
      toast.success(`Le cosplay « ${productToDelete.name} » a été supprimé`);
      setProductToDelete(null);
    } catch {
      toast.error("Erreur lors de la suppression du cosplay");
    } finally {
      setDeletingProduct(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.universe.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Catalogue Produits</h2>
          <p className="text-xs text-muted-foreground">{products.length} cosplay(s) au total</p>
        </div>

        <button onClick={() => setIsCreating(true)} className="btn-manga !py-2 text-xs">
          <Plus className="h-4 w-4" /> Ajouter un cosplay
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par nom ou univers…"
          className="field !pl-9 text-xs"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="manga-panel border-dashed bg-card p-12 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto h-12 w-12 opacity-30" />
          <p className="mt-3 font-bold">Aucun produit trouvé</p>
          <p className="text-xs">Cliquez sur « Ajouter un cosplay » pour enrichir la boutique.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className={`manga-panel relative bg-card p-4 ${!prod.active ? "opacity-60" : ""}`}
            >
              <div className="flex gap-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden border border-border bg-ink">
                  {prod.images[0] ? (
                    <img src={prod.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      Sans photo
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {prod.category}
                    </span>
                    {!prod.active && (
                      <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">
                        Masqué
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 truncate font-bold text-sm">{prod.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{prod.universe || "—"}</p>
                  <p className="mt-1 font-display text-sm text-primary">
                    {prod.base_price == null ? "Prix sur demande" : formatPrice(prod.base_price)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                <button
                  onClick={() => toggleActive(prod)}
                  className="btn-ghost-manga !px-2 !py-1 text-xs"
                  title={prod.active ? "Masquer" : "Afficher"}
                >
                  {prod.active ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[11px]">{prod.active ? "Visible" : "Masqué"}</span>
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => duplicate(prod)}
                    className="btn-ghost-manga !p-1.5"
                    title="Dupliquer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingProduct(prod)}
                    className="btn-ghost-manga !px-2.5 !py-1 text-xs"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(prod)}
                    className="btn-ghost-manga !p-1.5 !text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isCreating || editingProduct) && (
        <ProductEditModal
          initialProduct={editingProduct}
          onClose={() => {
            setIsCreating(false);
            setEditingProduct(null);
          }}
          onSaved={(saved) => {
            setProducts((prev) => {
              const idx = prev.findIndex((p) => p.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
            setIsCreating(false);
            setEditingProduct(null);
          }}
          onDeleted={(id) => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setIsCreating(false);
            setEditingProduct(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Supprimer le cosplay"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le cosplay « ${productToDelete?.name} » ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        loading={deletingProduct}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}

function ProductEditModal({
  initialProduct,
  onClose,
  onSaved,
  onDeleted,
}: {
  initialProduct: Product | null;
  onClose: () => void;
  onSaved: (p: Product) => void;
  onDeleted?: (id: string) => void;
}) {
  const [name, setName] = useState(initialProduct?.name || "");
  const [category, setCategory] = useState<CategoryKey>(initialProduct?.category || "anime");
  const [universe, setUniverse] = useState(initialProduct?.universe || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [basePrice, setBasePrice] = useState<string>(
    initialProduct?.base_price != null ? String(initialProduct.base_price) : "",
  );
  const [weaponPrice, setWeaponPrice] = useState<string>(
    initialProduct?.weapon_price != null ? String(initialProduct.weapon_price) : "",
  );
  const [accessoriesPrice, setAccessoriesPrice] = useState<string>(
    initialProduct?.accessories_price != null ? String(initialProduct.accessories_price) : "",
  );
  const [weaponOnlyPrice, setWeaponOnlyPrice] = useState<string>(
    initialProduct?.weapon_only_price != null ? String(initialProduct.weapon_only_price) : "",
  );
  const [accessoriesOnlyPrice, setAccessoriesOnlyPrice] = useState<string>(
    initialProduct?.accessories_only_price != null
      ? String(initialProduct.accessories_only_price)
      : "",
  );
  const [productionDays, setProductionDays] = useState<string>(
    initialProduct?.production_days != null ? String(initialProduct.production_days) : "",
  );
  const [urgentDays, setUrgentDays] = useState<string>(
    initialProduct?.urgent_days != null ? String(initialProduct.urgent_days) : "",
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [featured, setFeatured] = useState<boolean>(initialProduct?.featured || false);
  const [active, setActive] = useState<boolean>(
    initialProduct?.active !== undefined ? initialProduct.active : true,
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteProduct = async () => {
    if (!initialProduct) return;
    setDeleting(true);
    try {
      await adminDeleteProduct({ data: { productId: initialProduct.id } });
      toast.success(`Le cosplay « ${initialProduct.name} » a été supprimé`);
      setShowDeleteConfirm(false);
      onDeleted?.(initialProduct.id);
    } catch {
      toast.error("Erreur lors de la suppression du cosplay");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const url = await uploadCompressedPhoto(file);
        uploadedUrls.push(url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);
    } catch {
      toast.error("Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    await adminDeletePhotoFile({ data: { url } });
  };

  const setPrimaryImage = (url: string) => {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
    toast.success("Photo principale mise à jour");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du cosplay est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: initialProduct?.id,
        name: name.trim(),
        category,
        universe: universe.trim(),
        description: description.trim(),
        base_price: basePrice ? Number(basePrice) : null,
        weapon_price: weaponPrice ? Number(weaponPrice) : null,
        accessories_price: accessoriesPrice ? Number(accessoriesPrice) : null,
        weapon_only_price: weaponOnlyPrice ? Number(weaponOnlyPrice) : null,
        accessories_only_price: accessoriesOnlyPrice ? Number(accessoriesOnlyPrice) : null,
        production_days: productionDays ? Number(productionDays) : null,
        urgent_days: urgentDays ? Number(urgentDays) : null,
        featured,
        active,
        images,
      };

      const res = await adminSaveProduct({ data: payload });
      toast.success(initialProduct ? "Cosplay mis à jour !" : "Nouveau cosplay ajouté !");
      onSaved(res.product);
    } catch (error) {
      console.error("[ADMIN SAVE PRODUCT]", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement du produit",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="manga-panel relative max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-card p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-display text-2xl text-primary">
          {initialProduct ? `Modifier « ${initialProduct.name} »` : "Nouveau Cosplay"}
        </h3>

        <form onSubmit={submit} className="mt-6 space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-muted-foreground">Nom du cosplay *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field mt-1 text-sm"
                placeholder="Ex : Kimono Samouraï Écarlate"
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground">Univers</label>
              <input
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                className="field mt-1 text-sm"
                placeholder="Ex : Naruto, Fantasy RPG, Batman…"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Catégorie</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className="chip text-xs"
                  data-active={category === c.key}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field mt-1 min-h-20 text-xs"
              placeholder="Détails du costume, matières utilisées, pièces incluses…"
            />
          </div>

          {/* Tarifs */}
          <div className="rounded border border-border bg-background p-3">
            <p className="font-bold text-foreground">
              Tarifs (laisser vide pour « Prix sur demande »)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-muted-foreground">Prix costume de base (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="field mt-1 text-xs"
                  placeholder="Ex : 45000"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Supplément Arme (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={weaponPrice}
                  onChange={(e) => setWeaponPrice(e.target.value)}
                  className="field mt-1 text-xs"
                  placeholder="Ex : 10000"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Supplément Accessoires (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={accessoriesPrice}
                  onChange={(e) => setAccessoriesPrice(e.target.value)}
                  className="field mt-1 text-xs"
                  placeholder="Ex : 8000"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Arme seule (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={weaponOnlyPrice}
                  onChange={(e) => setWeaponOnlyPrice(e.target.value)}
                  className="field mt-1 text-xs"
                  placeholder="Ex : 15000"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Accessoires seuls (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={accessoriesOnlyPrice}
                  onChange={(e) => setAccessoriesOnlyPrice(e.target.value)}
                  className="field mt-1 text-xs"
                  placeholder="Ex : 12000"
                />
              </div>
            </div>
          </div>

          {/* Délais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-muted-foreground">Délai normal (jours)</label>
              <input
                type="number"
                min={1}
                value={productionDays}
                onChange={(e) => setProductionDays(e.target.value)}
                className="field mt-1 text-xs"
                placeholder="Ex : 14"
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground">Délai urgent (jours)</label>
              <input
                type="number"
                min={1}
                value={urgentDays}
                onChange={(e) => setUrgentDays(e.target.value)}
                className="field mt-1 text-xs"
                placeholder="Ex : 7"
              />
            </div>
          </div>

          {/* Visibilité & Mise en avant */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-semibold">Visible dans la boutique</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="font-semibold">Mettre en avant (Featured)</span>
            </label>
          </div>

          {/* Gestion des photos */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground">
                Photos du produit ({images.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-ghost-manga !px-2.5 !py-1 text-xs"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Ajouter des photos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </div>

            {images.length > 0 ? (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
                {images.map((url, i) => (
                  <div
                    key={url}
                    className="group relative h-28 w-24 shrink-0 overflow-hidden border-2 border-border bg-ink"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 bg-primary px-1 py-0.5 text-[9px] font-bold text-primary-foreground">
                        Principale
                      </span>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="rounded bg-destructive p-1 text-destructive-foreground"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(url)}
                          className="rounded bg-primary px-1 py-0.5 text-[9px] font-bold text-primary-foreground"
                        >
                          Définir principale
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-muted-foreground">
                Aucune photo. Une carte stylisée sera affichée par défaut.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            {initialProduct && onDeleted ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-ghost-manga !text-destructive !py-2 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer ce cosplay
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost-manga !py-2 text-xs">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="btn-manga !py-2 text-xs">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer le cosplay"}
              </button>
            </div>
          </div>
        </form>

        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Supprimer le cosplay"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le cosplay « ${initialProduct?.name} » ? Cette action est irréversible.`}
          confirmLabel="Oui, supprimer"
          loading={deleting}
          onConfirm={handleDeleteProduct}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}

// ===========================================================================
// SECTION 3 : PHOTOS DU SITE
// ===========================================================================

function VisualsSection() {
  const [images, setImages] = useState<HomeImage[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [imgs, st] = await Promise.all([adminGetHomeImages(), getSettings()]);
      setImages(imgs);
      setSettings(st);
    } catch {
      toast.error("Erreur de chargement des visuels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const heroImage = images.find((i) => i.kind === "hero");
  const carouselImages = images.filter((i) => i.kind === "carousel");
  const galleryImages = images.filter((i) => i.kind === "gallery");
  const categoryImages = images.filter((i) => i.kind === "category");

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl">Photos & Visuels du Site</h2>
        <p className="text-xs text-muted-foreground">
          Gérez l'ensemble des visuels publics. Les images supprimées rétablissent l'état vide
          élégant (dégradé, cartes manga, sections masquées).
        </p>
      </div>

      {/* 1. Photo Héros */}
      <div className="manga-panel bg-card p-5">
        <h3 className="font-display text-xl text-primary">Photo Héros d'accueil</h3>
        <p className="text-xs text-muted-foreground">
          Grande photo principale de la page d'accueil (bannière grand format).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="relative aspect-video w-56 overflow-hidden border-2 border-foreground bg-ink">
            {heroImage ? (
              <img src={heroImage.url} alt="Héros" className="h-full w-full object-cover" />
            ) : (
              <div className="halftone flex h-full w-full items-center justify-center p-2 text-center text-xs text-sakura">
                Dégradé & bulles manga actifs
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <UploadButton
              label={heroImage ? "Remplacer la photo héros" : "Ajouter une photo héros"}
              onUploaded={async (url) => {
                await adminSaveHomeImage({
                  data: { url, kind: "hero", caption: "Héros", position: 0 },
                });
                toast.success("Photo héros enregistrée !");
                load();
              }}
            />
            {heroImage && (
              <button
                onClick={async () => {
                  await adminDeleteHomeImage({ data: { id: heroImage.id } });
                  await adminDeletePhotoFile({ data: { url: heroImage.url } });
                  toast.success("Photo héros retirée");
                  load();
                }}
                className="btn-ghost-manga !py-1 text-xs !text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer (revenir au dégradé)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Couvertures des Catégories */}
      <div className="manga-panel bg-card p-5">
        <h3 className="font-display text-xl text-primary">Couvertures des Catégories</h3>
        <p className="text-xs text-muted-foreground">
          Photo d'illustration de chaque univers. Sans photo, la carte manga stylisée apparaît.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ALL_CATEGORIES.map((c) => {
            const cover = categoryImages.find((img) => img.category_key === c.key);
            return (
              <div key={c.key} className="border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{c.label}</span>
                  <span className="font-jp text-xs text-sakura">{c.jp}</span>
                </div>

                <div className="relative mt-2 aspect-[3/4] overflow-hidden border border-border bg-ink">
                  {cover ? (
                    <img src={cover.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="halftone flex h-full w-full items-center justify-center p-2 text-center text-xs text-primary">
                      Carte manga
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-1.5">
                  <UploadButton
                    label={cover ? "Changer" : "Ajouter"}
                    onUploaded={async (url) => {
                      await adminSaveHomeImage({
                        data: {
                          url,
                          kind: "category",
                          category_key: c.key,
                          caption: c.label,
                          position: 0,
                        },
                      });
                      toast.success(`Couverture « ${c.label} » mise à jour !`);
                      load();
                    }}
                  />
                  {cover && (
                    <button
                      onClick={async () => {
                        await adminDeleteHomeImage({ data: { id: cover.id } });
                        await adminDeletePhotoFile({ data: { url: cover.url } });
                        toast.success("Couverture supprimée");
                        load();
                      }}
                      className="btn-ghost-manga !py-1 text-[11px] !text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Carrousel d'accueil */}
      <div className="manga-panel bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-primary">Carrousel défilant</h3>
            <p className="text-xs text-muted-foreground">
              Bandeau animé sur l'accueil ({carouselImages.length} photo(s)). Si vide, la section
              est masquée.
            </p>
          </div>
          <UploadButton
            label="Ajouter au carrousel"
            onUploaded={async (url) => {
              await adminSaveHomeImage({
                data: {
                  url,
                  kind: "carousel",
                  caption: "Cosplay",
                  position: carouselImages.length,
                },
              });
              toast.success("Photo ajoutée au carrousel !");
              load();
            }}
          />
        </div>

        {carouselImages.length > 0 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
            {carouselImages.map((img, i) => (
              <div
                key={img.id}
                className="relative h-44 w-32 shrink-0 overflow-hidden border border-border bg-ink"
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1">
                  <input
                    value={img.caption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImages((prev) =>
                        prev.map((x) => (x.id === img.id ? { ...x, caption: val } : x)),
                      );
                    }}
                    onBlur={async () => {
                      await adminSaveHomeImage({ data: img });
                      toast.success("Légende enregistrée");
                    }}
                    className="w-full bg-transparent text-[10px] text-white outline-none"
                    placeholder="Légende…"
                  />
                </div>
                <div className="absolute right-1 top-1 flex flex-col gap-1">
                  <button
                    onClick={async () => {
                      await adminDeleteHomeImage({ data: { id: img.id } });
                      await adminDeletePhotoFile({ data: { url: img.url } });
                      toast.success("Photo retirée du carrousel");
                      load();
                    }}
                    className="rounded bg-destructive p-1 text-destructive-foreground"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {i > 0 && (
                    <button
                      onClick={async () => {
                        const prevImg = carouselImages[i - 1];
                        if (!prevImg) return;
                        await adminReorderHomeImages({
                          data: {
                            items: [
                              { id: img.id, position: prevImg.position },
                              { id: prevImg.id, position: img.position },
                            ],
                          },
                        });
                        load();
                      }}
                      className="rounded bg-background/80 p-1 text-foreground"
                      title="Déplacer vers la gauche"
                    >
                      <ArrowUp className="h-3 w-3 -rotate-90" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs italic text-muted-foreground">
            Carrousel vide (section masquée automatiquement sur l'accueil).
          </p>
        )}
      </div>

      {/* 4. Section Réalisations */}
      <div className="manga-panel bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-primary">Réalisations (Galerie)</h3>
            <p className="text-xs text-muted-foreground">
              Photos des costumes créés par NDC ({galleryImages.length} photo(s)). Si vide, la
              section est masquée.
            </p>
          </div>
          <UploadButton
            label="Ajouter une réalisation"
            onUploaded={async (url) => {
              await adminSaveHomeImage({
                data: {
                  url,
                  kind: "gallery",
                  caption: "Création atelier",
                  position: galleryImages.length,
                },
              });
              toast.success("Réalisation ajoutée !");
              load();
            }}
          />
        </div>

        {galleryImages.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden border border-border bg-ink"
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        await adminDeleteHomeImage({ data: { id: img.id } });
                        await adminDeletePhotoFile({ data: { url: img.url } });
                        toast.success("Réalisation supprimée");
                        load();
                      }}
                      className="rounded bg-destructive p-1 text-destructive-foreground"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={img.caption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImages((prev) =>
                        prev.map((x) => (x.id === img.id ? { ...x, caption: val } : x)),
                      );
                    }}
                    onBlur={async () => {
                      await adminSaveHomeImage({ data: img });
                      toast.success("Légende enregistrée");
                    }}
                    className="w-full bg-black/80 px-1 py-0.5 text-[10px] text-white outline-none"
                    placeholder="Légende…"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs italic text-muted-foreground">
            Section réalisations vide (masquée automatiquement sur l'accueil).
          </p>
        )}
      </div>

      {/* 5. Logo */}
      <div className="manga-panel bg-card p-5">
        <h3 className="font-display text-xl text-primary">Logo du site</h3>
        <p className="text-xs text-muted-foreground">
          Image ou texte stylé affiché dans l'en-tête du site.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-44 items-center justify-center border border-border bg-ink p-2">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="font-display text-lg text-primary">
                {settings?.logo_text || "NDC COSPLAY"}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <UploadButton
              label={settings?.logo_url ? "Remplacer l'image du logo" : "Uploader un logo image"}
              onUploaded={async (url) => {
                if (!settings) return;
                await adminUpdateSettings({ data: { ...settings, logo_url: url } });
                setSettings({ ...settings, logo_url: url });
                toast.success("Logo image mis à jour !");
              }}
            />
            {settings?.logo_url && (
              <button
                onClick={async () => {
                  if (!settings) return;
                  await adminDeletePhotoFile({ data: { url: settings.logo_url } });
                  await adminUpdateSettings({ data: { ...settings, logo_url: null } });
                  setSettings({ ...settings, logo_url: null });
                  toast.success("Logo image retiré (texte stylé rétabli)");
                }}
                className="btn-ghost-manga !py-1 text-xs !text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Revenir au texte stylé
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadButton({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (url: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCompressedPhoto(file);
      await onUploaded(url);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="btn-manga !px-3 !py-1.5 text-xs"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}

// ===========================================================================
// SECTION 4 : PARAMÈTRES
// ===========================================================================

function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Champs
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [email, setEmail] = useState("");
  const [depositPercent, setDepositPercent] = useState<string>("");
  const [urgentEnabled, setUrgentEnabled] = useState(false);
  const [urgentFeePercent, setUrgentFeePercent] = useState<string>("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [logoText, setLogoText] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const s = await getSettings();
      setSettings(s);
      setWhatsapp(s.whatsapp || "221761766899");
      setInstagram(s.instagram || "");
      setTiktok(s.tiktok || "");
      setEmail(s.email || "");
      setDepositPercent(s.deposit_percent != null ? String(s.deposit_percent) : "");
      setUrgentEnabled(s.urgent_fee_percent != null);
      setUrgentFeePercent(s.urgent_fee_percent != null ? String(s.urgent_fee_percent) : "");
      setZones(s.delivery_zones || []);
      setLogoText(s.logo_text || "NDC COSPLAY");
    } catch {
      toast.error("Erreur de chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addZone = () => {
    setZones([...zones, { zone: "Nouvelle zone", prix: 2000, delai: "24-48h" }]);
  };

  const removeZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const updateZone = (index: number, patch: Partial<DeliveryZone>) => {
    setZones(zones.map((z, i) => (i === index ? { ...z, ...patch } : z)));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp.trim()) {
      toast.error("Le numéro WhatsApp est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const payload: Settings = {
        whatsapp: whatsapp.replace(/[^\d+]/g, "").trim(),
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        email: email.trim() || null,
        deposit_percent: depositPercent ? Number(depositPercent) : null,
        urgent_fee_percent: urgentEnabled && urgentFeePercent ? Number(urgentFeePercent) : null,
        delivery_zones: zones,
        logo_text: logoText.trim() || "NDC COSPLAY",
        logo_url: settings?.logo_url ?? null,
      };

      await adminUpdateSettings({ data: payload });
      toast.success("Paramètres enregistrés et appliqués en direct !");
      load();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <div>
        <h2 className="font-display text-3xl">Paramètres du Site</h2>
        <p className="text-xs text-muted-foreground">
          Ces paramètres s'appliquent en temps réel sur l'ensemble de la boutique publique.
        </p>
      </div>

      {/* Coordonnées & Réseaux */}
      <div className="manga-panel bg-card p-5 space-y-4">
        <h3 className="font-display text-xl text-primary">Contact & Réseaux</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Numéro WhatsApp (avec indicatif) *
            </label>
            <input
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="Ex : 221761766899"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email de contact</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="pascaldossou7@gmail.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Nom d'utilisateur Instagram
            </label>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="pascalhdossou (vide = masqué)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Nom d'utilisateur TikTok
            </label>
            <input
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="field mt-1 text-sm"
              placeholder="ndccosplay (vide = masqué)"
            />
          </div>
        </div>
      </div>

      {/* Options de Commande */}
      <div className="manga-panel bg-card p-5 space-y-4">
        <h3 className="font-display text-xl text-primary">Options de Commande</h3>

        {/* Commande urgente */}
        <div className="rounded border border-border bg-background p-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={urgentEnabled}
              onChange={(e) => setUrgentEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-bold text-sm">Activer l'option « Commande urgente »</span>
          </label>

          {urgentEnabled && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">
                Supplément commande urgente (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={urgentFeePercent}
                onChange={(e) => setUrgentFeePercent(e.target.value)}
                className="field mt-1 max-w-xs text-sm"
                placeholder="Ex : 30"
              />
            </div>
          )}
        </div>

        {/* Acompte informatif */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Acompte par défaut (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={depositPercent}
            onChange={(e) => setDepositPercent(e.target.value)}
            className="field mt-1 max-w-xs text-sm"
            placeholder="Ex : 50 (laisser vide si non précisé)"
          />
        </div>

        {/* Texte du Logo */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Texte du Logo</label>
          <input
            value={logoText}
            onChange={(e) => setLogoText(e.target.value)}
            className="field mt-1 max-w-xs text-sm"
            placeholder="NDC COSPLAY"
          />
        </div>
      </div>

      {/* Zones de Livraison */}
      <div className="manga-panel bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl text-primary">Zones & Tarifs de Livraison</h3>
            <p className="text-xs text-muted-foreground">
              {zones.length === 0
                ? "Aucune zone configurée : la mention « Tarif et délai confirmés sur WhatsApp » sera affichée."
                : `${zones.length} zone(s) configurée(s).`}
            </p>
          </div>
          <button type="button" onClick={addZone} className="btn-ghost-manga !py-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Ajouter une zone
          </button>
        </div>

        {zones.length > 0 && (
          <div className="space-y-3">
            {zones.map((z, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 border border-border bg-background p-3"
              >
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] text-muted-foreground">Zone</label>
                  <input
                    value={z.zone}
                    onChange={(e) => updateZone(i, { zone: e.target.value })}
                    className="field mt-0.5 text-xs"
                    placeholder="Ex : Dakar Plateau, Médina"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[10px] text-muted-foreground">Prix (0 = Gratuit)</label>
                  <input
                    type="number"
                    min={0}
                    value={z.prix ?? ""}
                    onChange={(e) =>
                      updateZone(i, { prix: e.target.value ? Number(e.target.value) : null })
                    }
                    className="field mt-0.5 text-xs"
                    placeholder="1500"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[10px] text-muted-foreground">Délai</label>
                  <input
                    value={z.delai ?? ""}
                    onChange={(e) => updateZone(i, { delai: e.target.value || null })}
                    className="field mt-0.5 text-xs"
                    placeholder="24h"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => removeZone(i)}
                    className="p-1.5 text-destructive hover:bg-destructive/10"
                    title="Supprimer la zone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-manga !py-3">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Enregistrer les paramètres
        </button>
      </div>
    </form>
  );
}
