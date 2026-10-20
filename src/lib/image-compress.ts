/**
 * Utilitaire de compression d'images côté navigateur.
 * Redimensionne le côté long à maximum 1600 px et encode en WebP (qualité 0.85).
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<{ dataBase64: string; filename: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Impossible de décoder l'image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Contexte 2D non disponible"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let dataBase64 = canvas.toDataURL("image/webp", quality);
        // Fallback JPEG si le navigateur ne supporte pas WebP sur canvas
        if (!dataBase64.startsWith("data:image/webp")) {
          dataBase64 = canvas.toDataURL("image/jpeg", quality);
        }

        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const filename = `${baseName}.webp`;
        const sizeBytes = Math.round((dataBase64.length * 3) / 4);

        resolve({ dataBase64, filename, sizeBytes });
      };
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  });
}
