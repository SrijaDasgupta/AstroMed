import { ImageResponse } from "next/og";

/** App icons in the sizes phones and browsers ask for, drawn from the AstroMed orbit logo. */
export function generateImageMetadata() {
  return [32, 192, 512].map((size) => ({ id: String(size), size: { width: size, height: size }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const size = Number(await id);
  return new ImageResponse(<OrbitMark size={size} />, { width: size, height: size });
}

export function OrbitMark({ size }: { size: number }) {
  const pad = size * 0.2;
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#070b16", borderRadius: size > 64 ? 0 : size * 0.2 }}>
      <svg width={size - pad * 2} height={size - pad * 2} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.341 6.484A10 10 0 0 1 10.266 21.85" />
        <path d="M3.659 17.516A10 10 0 0 1 13.74 2.152" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
      </svg>
    </div>
  );
}
