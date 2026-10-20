import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({
  title,
  text,
  className = "",
}: {
  title: string;
  text: string;
  className?: string;
}) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* annulé */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié !");
  };
  return (
    <button
      type="button"
      onClick={share}
      className={`btn-ghost-manga !px-4 !py-2 text-xs ${className}`}
    >
      <Share2 className="h-4 w-4" /> Partager
    </button>
  );
}
