import type { EnvironmentId } from "@/lib/environments";

/**
 * Animated picture of where the astronaut is: a starfield plus a scene for the mission type.
 * On a transit the spacecraft sits on its route at the mission's progress (0–1).
 * Motion is CSS only and stops for people who ask for reduced motion (see globals.css).
 */

// Fixed star positions so server and browser draw the same picture.
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 137.5) % 600,
  y: (i * 71.3 + 13) % 200,
  r: i % 7 === 0 ? 1.4 : i % 3 === 0 ? 0.9 : 0.6,
  delay: (i % 9) * 0.45,
}));

function Planet({ cx, cy, r, from, to, id, ring }: { cx: number; cy: number; r: number; from: string; to: string; id: string; ring?: boolean }) {
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></radialGradient>
        <radialGradient id={`${id}-glow`}><stop offset="0.6" stopColor={from} stopOpacity="0.25" /><stop offset="1" stopColor={from} stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.5} fill={`url(#${id}-glow)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      {ring && <ellipse cx={cx} cy={cy} rx={r * 1.7} ry={r * 0.35} fill="none" stroke={from} strokeOpacity="0.35" transform={`rotate(-18 ${cx} ${cy})`} />}
    </g>
  );
}

const EARTH = { from: "#7dd3fc", to: "#1e40af" };
const MARS = { from: "#fdba74", to: "#9a3412" };
const MOON = { from: "#e2e8f0", to: "#64748b" };

function Ship({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="10" fill="#38bdf8" opacity="0.5" className="am-pulse" />
      <circle r="4" fill="#e0f2fe" />
      <path d="M-2 -9L2 -9L0 -14Z" fill="#e0f2fe" opacity="0.8" transform="rotate(60)" />
    </g>
  );
}

/** Point along a quadratic curve. */
function along(t: number, p0: [number, number], c: [number, number], p1: [number, number]): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}

function Transit({ progress, to, toName }: { progress: number; to: typeof MARS; toName: string }) {
  const p0: [number, number] = [80, 140], c: [number, number] = [300, -30], p1: [number, number] = [520, 70];
  const t = Math.min(1, Math.max(0, progress));
  const [x, y] = along(t, p0, c, p1);
  const route = `M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`;
  return (
    <g>
      <Planet cx={p0[0]} cy={p0[1]} r={30} {...EARTH} id="sc-earth" />
      <Planet cx={p1[0]} cy={p1[1]} r={22} {...to} id="sc-dest" />
      <path d={route} fill="none" stroke="#7dd3fc" strokeOpacity="0.35" strokeDasharray="3 6" />
      <path d={route} fill="none" stroke="#38bdf8" strokeWidth="2.5" pathLength={1} strokeDasharray={`${t} 2`} style={{ "--route-from": t } as React.CSSProperties} className="am-route" />
      <Ship x={x} y={y} />
      <text x={p0[0]} y={p0[1] + 46} textAnchor="middle" className="fill-slate-400 text-[11px]">Earth</text>
      <text x={p1[0]} y={p1[1] + 40} textAnchor="middle" className="fill-slate-400 text-[11px]">{toName}</text>
    </g>
  );
}

function Orbiting({ planet, id, label, moon }: { planet: typeof EARTH; id: string; label: string; moon?: typeof MOON }) {
  return (
    <g>
      <Planet cx={300} cy={118} r={46} {...planet} id={id} />
      <ellipse cx={300} cy={118} rx={92} ry={30} fill="none" stroke="#7dd3fc" strokeOpacity="0.3" strokeDasharray="2 5" transform="rotate(-12 300 118)" />
      <g className="am-orbit" style={{ transformOrigin: "300px 118px" }}>
        <g transform="rotate(-12 300 118)">
          <circle cx={392} cy={118} r="4" fill="#e0f2fe" />
          <circle cx={392} cy={118} r="9" fill="#38bdf8" opacity="0.4" className="am-pulse" />
        </g>
      </g>
      {moon && <Planet cx={500} cy={50} r={12} {...moon} id={`${id}-moon`} />}
      <text x={300} y={190} textAnchor="middle" className="fill-slate-400 text-[11px]">{label}</text>
    </g>
  );
}

function Surface({ planet, id, sky, skyId, label }: { planet: typeof MARS; id: string; sky: typeof EARTH; skyId: string; label: string }) {
  return (
    <g>
      <Planet cx={470} cy={45} r={13} {...sky} id={skyId} />
      <path d="M0 200V150Q150 120 300 140T600 132V200Z" fill={`url(#${id})`} />
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={planet.from} /><stop offset="1" stopColor={planet.to} /></linearGradient></defs>
      <g transform="translate(180 128)">
        <path d="M-18 8a18 14 0 0 1 36 0Z" fill="#e2e8f0" opacity="0.9" />
        <rect x="18" y="0" width="16" height="8" rx="2" fill="#cbd5e1" />
        <circle cx="-4" cy="-10" r="3" fill="#38bdf8" className="am-pulse" />
      </g>
      <text x={180} y={178} textAnchor="middle" className="fill-slate-900 text-[11px] font-medium">{label}</text>
    </g>
  );
}

export function MissionScene({ envId, progress, none }: { envId: EnvironmentId; progress: number; none?: boolean }) {
  return (
    <svg viewBox="0 0 600 200" className="block h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="sc-sky" cx="70%" cy="20%" r="90%"><stop offset="0" stopColor="#13284a" /><stop offset="1" stopColor="#070b16" /></radialGradient>
      </defs>
      <rect width="600" height="200" fill="url(#sc-sky)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e2e8f0" className="am-twinkle" style={{ animationDelay: `${s.delay}s` }} />
      ))}
      {none ? (
        <Orbiting planet={EARTH} id="sc-home" label="No mission yet" />
      ) : envId === "mars-transit" ? (
        <Transit progress={progress} to={MARS} toName="Mars" />
      ) : envId === "leo" ? (
        <Orbiting planet={EARTH} id="sc-leo" label="Low Earth orbit" moon={MOON} />
      ) : envId === "lunar-surface" ? (
        <Surface planet={MOON} id="sc-moon" sky={EARTH} skyId="sc-sky-earth" label="Lunar base" />
      ) : envId === "mars-surface" ? (
        <Surface planet={MARS} id="sc-mars" sky={MOON} skyId="sc-sky-phobos" label="Mars base" />
      ) : (
        <Orbiting planet={EARTH} id="sc-analog" label="Earth analog station" />
      )}
    </svg>
  );
}
