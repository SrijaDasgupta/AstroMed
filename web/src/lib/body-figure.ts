/**
 * Positions on the My body figure image (public/body/figure.webp, 1672 × 941 px, generated with
 * ChatGPT and labeled on screen as AI-generated). Body-part hotspots and problem pins are placed by hand on the figure's anatomy;
 * "person's right" is on the viewer's left. Pure data.
 */
export const FIGURE = { src: "/body/figure.webp", width: 1672, height: 941, viewBox: { x: 585, y: 0, w: 500, h: 900 } };

/** Hotspot for each body part (ids from lib/body.ts). */
export const PART_POINTS: Record<string, { x: number; y: number }> = {
  brain: { x: 836, y: 40 },
  eyes: { x: 822, y: 68 },
  ears: { x: 866, y: 76 },
  airways: { x: 800, y: 215 },
  heart: { x: 850, y: 228 },
  gut: { x: 836, y: 318 },
  kidneys: { x: 836, y: 392 },
  bones: { x: 795, y: 405 },
  muscles: { x: 798, y: 500 },
  skin: { x: 724, y: 258 },
};

/** Pin for each body area (ids from lib/body-notes.ts); xLeft is the person's left side. */
export const AREA_POINTS: Record<string, { x: number; y: number; xLeft?: number }> = {
  head: { x: 836, y: 34 },
  eyes: { x: 822, y: 68, xLeft: 850 },
  ears: { x: 806, y: 78, xLeft: 866 },
  mouth: { x: 836, y: 100 },
  "nose-throat": { x: 836, y: 122 },
  neck: { x: 836, y: 142 },
  "upper-back": { x: 836, y: 195 },
  chest: { x: 836, y: 245 },
  abdomen: { x: 836, y: 325 },
  "lower-back": { x: 836, y: 350 },
  pelvis: { x: 836, y: 408 },
  shoulder: { x: 765, y: 178, xLeft: 907 },
  arm: { x: 714, y: 272, xLeft: 958 },
  hand: { x: 640, y: 462, xLeft: 1032 },
  hip: { x: 795, y: 418, xLeft: 877 },
  thigh: { x: 795, y: 500, xLeft: 877 },
  knee: { x: 783, y: 600, xLeft: 889 },
  "lower-leg": { x: 786, y: 700, xLeft: 886 },
  foot: { x: 775, y: 830, xLeft: 897 },
  skin: { x: 966, y: 330 },
};

export function figurePin(area: string, side?: string) {
  const a = AREA_POINTS[area];
  if (!a) return undefined;
  return { x: side === "left" && a.xLeft !== undefined ? a.xLeft : a.x, y: a.y };
}
