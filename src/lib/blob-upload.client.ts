import { upload } from "@vercel/blob/client";
import { compressImageToWebP } from "./image-compress";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadCompressedPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Format refusé. Utilise une image JPEG, PNG ou WebP.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("La photo doit peser 5 Mo maximum.");
  }

  const compressed = await compressImageToWebP(file);
  const response = await fetch(compressed.dataBase64);
  const blob = await response.blob();
  if (blob.type !== "image/webp" || blob.size > MAX_BYTES) {
    throw new Error("Impossible de préparer la photo au format WebP.");
  }
  const safeName = `${crypto.randomUUID()}.webp`;
  const result = await upload(safeName, blob, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
    contentType: "image/webp",
    clientPayload: JSON.stringify({ contentType: "image/webp", size: blob.size }),
  });
  return result.url;
}
