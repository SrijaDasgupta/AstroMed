"use client";

import { savePhotoImportAction } from "@/app/actions";
import { PhotoImport } from "./PhotoImport";

/** Shrinks a photo to at most 2000 px as JPEG so it uploads quickly and stays under hosting limits. */
async function shrink(image: File): Promise<File> {
  const bmp = await createImageBitmap(image);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't prepare the photo."))), "image/jpeg", 0.85));
  return new File([blob], `${image.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
}

/** Photo import wired to AstroMed: radiation goes to My exposure, sleep to the Sleep orbit, health text and photo to My records. */
export function PhotoImportCard({ demo }: { demo: boolean }) {
  return (
    <PhotoImport
      healthNote={demo ? "In the demo, the text and readings are kept in this browser; the photo itself is only stored with an account." : "The photo is kept with the text and readings."}
      saveRecord={async (entry, image) => {
        const form = new FormData();
        form.set("category", entry.category);
        form.set("record", JSON.stringify(entry.record));
        if (entry.category === "health" && !demo) form.set("image", await shrink(image));
        const result = await savePhotoImportAction(form);
        if ("error" in result) throw Object.assign(new Error(result.error), { userMessage: result.error });
        return result;
      }}
    />
  );
}
