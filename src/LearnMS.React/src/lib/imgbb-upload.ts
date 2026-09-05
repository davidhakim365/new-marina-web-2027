import { api } from "@/api";

const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;

/** Convert HEIC / huge camera photos to a JPEG phones can actually decode. */
async function compressForPhones(file: File): Promise<File> {
  const isAlreadyWebFriendly =
    (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") &&
    file.size < 400_000;

  if (isAlreadyWebFriendly) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_EDGE || height > MAX_EDGE) {
      const scale = Math.min(MAX_EDGE / width, MAX_EDGE / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "question";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadToImgBb(file: File): Promise<string> {
  const prepared = await compressForPhones(file);
  const formData = new FormData();
  formData.append("file", prepared);
  const res = await api.post<{ status: boolean; data: { url: string }; message: string }>(
    "/api/uploads/imgbb",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.url;
}
