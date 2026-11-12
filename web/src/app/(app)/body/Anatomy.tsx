/**
 * A front-view anatomical figure drawn in SVG (300 × 640). One side is drawn and mirrored.
 * The figure's left is the person's right, as when facing someone.
 */

/** Silhouette of one half, used as the darker base under the muscles. */
const HALF_BASE =
  "M150,80 L138,80 C136,92 130,100 108,110 C86,114 76,132 77,152 C71,176 69,200 73,216 C65,242 59,270 57,296 C47,308 45,328 51,340 C57,349 66,345 68,336 L77,300 C87,272 97,246 104,214 L108,190 C110,230 113,258 116,280 C106,312 104,362 110,412 L112,446 C106,480 108,530 116,570 C111,590 105,606 111,616 C125,622 140,620 144,610 L140,570 C144,520 146,480 142,448 L141,424 C146,380 148,330 150,306 Z";

/** Muscle groups on one half: [path, shade] where shade picks the gradient. */
const HALF_MUSCLES: [string, "a" | "b" | "c"][] = [
  // trapezius
  ["M150,94 C140,99 124,104 109,111 L131,116 C140,109 146,105 150,104 Z", "b"],
  // deltoid
  ["M108,112 C92,114 82,128 80,150 C84,159 91,163 97,160 C99,144 105,131 119,121 Z", "a"],
  // pectoral
  ["M150,118 C140,113 125,114 117,122 C105,136 104,156 112,168 C124,177 140,177 150,172 Z", "a"],
  // serratus and obliques
  ["M111,170 C107,192 109,222 116,250 C121,264 128,272 135,280 L136,184 C128,180 118,176 111,170 Z", "b"],
  // abs, four rows
  ["M136.5,180 L149,180 L149,201 L137,201 C136,194 136,187 136.5,180 Z", "c"],
  ["M137,205 L149,205 L149,226 L137.5,226 Z", "c"],
  ["M137.5,230 L149,230 L149,252 L138,252 Z", "c"],
  ["M138,256 L149,256 L149,284 C144,282 140,278 138.5,272 Z", "c"],
  // triceps (outer arm)
  ["M80,152 C74,172 72,196 75,214 L86,214 C84,196 88,174 96,161 Z", "b"],
  // biceps
  ["M97,161 C89,173 85,196 87,213 C93,220 101,218 104,210 C108,190 108,172 104,162 Z", "a"],
  // forearm
  ["M75,216 C67,242 61,270 59,295 C64,302 72,302 76,297 C85,271 95,244 101,218 C93,222 82,221 75,216 Z", "a"],
  // hand
  ["M59,297 C51,307 47,322 51,337 C55,345 63,344 66,336 L68,320 C72,312 74,305 76,299 C70,302 63,302 59,297 Z", "b"],
  // groin
  ["M135,282 C140,290 145,298 150,304 L150,288 C146,286 140,284 135,282 Z", "b"],
  // outer quad (vastus lateralis)
  ["M117,282 C107,312 105,360 111,408 C114,418 119,424 125,426 C122,380 124,330 131,292 C127,288 122,284 117,282 Z", "b"],
  // rectus femoris
  ["M131,292 C124,330 122,380 125,426 C131,428 136,424 138,418 C142,376 146,330 148,302 C142,298 136,295 131,292 Z", "a"],
  // vastus medialis (teardrop above knee)
  ["M139,384 C133,398 133,414 139,424 C147,420 149,404 146,388 Z", "c"],
  // shin and calf
  ["M114,450 C107,484 109,530 117,570 L137,572 C141,530 143,484 140,450 C132,456 121,456 114,450 Z", "b"],
  // tibialis
  ["M124,458 C121,490 122,530 127,566 L132,566 C134,530 135,490 133,458 Z", "a"],
  // foot
  ["M117,573 C112,591 106,605 112,614 C125,620 139,618 143,610 L138,573 Z", "b"],
];

export function AnatomyDefs() {
  return (
    <defs>
      <linearGradient id="m-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f59e7b" />
        <stop offset="0.55" stopColor="#df6a47" />
        <stop offset="1" stopColor="#b9432c" />
      </linearGradient>
      <linearGradient id="m-b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e07654" />
        <stop offset="1" stopColor="#a63a26" />
      </linearGradient>
      <linearGradient id="m-c" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3a07f" />
        <stop offset="1" stopColor="#cf5a3c" />
      </linearGradient>
      <radialGradient id="m-head" cx="0.45" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#f0a080" />
        <stop offset="1" stopColor="#b9503a" />
      </radialGradient>
      <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
      <pattern id="striations" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(70)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="#7c2d12" strokeOpacity="0.18" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

function Half() {
  return (
    <g>
      <path d={HALF_BASE} fill="#7f2a1c" />
      {HALF_MUSCLES.map(([d, shade], i) => (
        <g key={i}>
          <path d={d} fill={`url(#m-${shade})`} stroke="#6b1f12" strokeWidth={0.8} strokeLinejoin="round" />
          <path d={d} fill="url(#striations)" />
        </g>
      ))}
      {/* kneecap */}
      <ellipse cx="129" cy="438" rx="9" ry="11" fill="#e9a38a" stroke="#6b1f12" strokeWidth={0.8} />
      {/* collarbone */}
      <path d="M148,112 C136,110 122,112 110,114" fill="none" stroke="#f6c1a8" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Perspective grid floor under the feet. */
export function Floor() {
  const lines = [];
  for (let i = -6; i <= 6; i++) lines.push(<line key={`r${i}`} x1={150 + i * 12} y1={600} x2={150 + i * 34} y2={640} />);
  for (let j = 0; j < 4; j++) {
    const y = 604 + j * 11;
    const w = 90 + j * 34;
    lines.push(<line key={`c${j}`} x1={150 - w} y1={y} x2={150 + w} y2={y} />);
  }
  return (
    <g>
      <ellipse cx="150" cy="618" rx="120" ry="22" fill="url(#floor)" />
      <g stroke="#7dd3fc" strokeOpacity={0.14} strokeWidth={0.8}>{lines}</g>
      <ellipse cx="150" cy="616" rx="58" ry="7" fill="#000" fillOpacity={0.45} />
    </g>
  );
}

export function AnatomyFigure() {
  return (
    <g>
      <Half />
      <g transform="matrix(-1 0 0 1 300 0)"><Half /></g>
      {/* neck */}
      <path d="M137,74 C138,86 136,96 132,104 L168,104 C164,96 162,86 163,74 Z" fill="url(#m-b)" stroke="#6b1f12" strokeWidth={0.8} />
      <path d="M140,78 L148,104 M160,78 L152,104" stroke="#6b1f12" strokeOpacity={0.5} strokeWidth={1} />
      {/* head */}
      <ellipse cx="150" cy="48" rx="24" ry="31" fill="url(#m-head)" stroke="#6b1f12" strokeWidth={0.8} />
      <path d="M139,52 Q142,49 145,52 M155,52 Q158,49 161,52" stroke="#5b1a10" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <path d="M150,54 L148,64 L152,64" stroke="#5b1a10" strokeOpacity={0.6} strokeWidth={1} fill="none" />
      <path d="M144,70 Q150,73 156,70" stroke="#5b1a10" strokeOpacity={0.7} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      {/* centre line of the abdomen */}
      <path d="M150,176 L150,296" stroke="#6b1f12" strokeWidth={1.2} />
    </g>
  );
}
