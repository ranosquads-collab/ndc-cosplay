import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isUserAuthenticated } from "@/lib/admin.server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const Route = createFileRoute("/api/blob-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
          return new Response("Configuration BLOB_READ_WRITE_TOKEN manquante", { status: 503 });
        }
        try {
          const json = (await request.json()) as HandleUploadBody;
          const body = await handleUpload({
            body: json,
            request,
            token,
            onBeforeGenerateToken: async (_pathname, clientPayload) => {
              if (!(await isUserAuthenticated())) {
                throw new Error("Non autorisé");
              }
              let payload: { contentType?: string; size?: number } = {};
              try {
                payload = JSON.parse(clientPayload ?? "{}") as typeof payload;
              } catch {
                throw new Error("Métadonnées de photo invalides.");
              }
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(payload.contentType ?? "") ||
                !Number.isFinite(payload.size) ||
                Number(payload.size) <= 0 ||
                Number(payload.size) > MAX_IMAGE_BYTES
              ) {
                throw new Error("Photo invalide : WebP de 5 Mo maximum requis.");
              }
              return {
                allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
                maximumSizeInBytes: MAX_IMAGE_BYTES,
                addRandomSuffix: true,
                tokenPayload: JSON.stringify({ admin: true }),
              };
            },
            onUploadCompleted: async () => {
              // L'URL du Blob est enregistrée dans products.images ou home_images par l'interface admin.
            },
          });
          return Response.json(body);
        } catch (error) {
          console.error("Blob upload error:", error);
          return new Response("Échec de l'envoi de la photo", { status: 400 });
        }
      },
    },
  },
});
