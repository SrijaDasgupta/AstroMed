'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import type { EnvironmentId } from '@/lib/environments';
import { button, ModuleCard } from './ui';

/**
 * Animated launch to the astronaut's current mission destination. Adapted from the Mission launch
 * module: limited to AstroMed's space mission types, and it follows the mission set on the Mission page.
 */
const destinations = {
  earth: { name: 'Earth', color: '#318dce', shade: '#152b54' },
  moon: { name: 'Moon', color: '#d6dce5', shade: '#4c5368' },
  mars: { name: 'Mars', color: '#dc7755', shade: '#602836' },
  iss: { name: 'Space station', color: '#bae6fd', shade: '#334155' },
} as const;

type MissionDestination = keyof typeof destinations;

/** Where each space mission type flies to, and what the arrival says. */
const ROUTES: Partial<Record<EnvironmentId, { destination: MissionDestination; title: string; arrival: string }>> = {
  leo: { destination: 'iss', title: 'Earth to low Earth orbit', arrival: 'Docked at the space station.' },
  'lunar-surface': { destination: 'moon', title: 'Earth to the Moon', arrival: 'Arrived at the Moon: down to the lunar base.' },
  'mars-transit': { destination: 'mars', title: 'Earth to Mars', arrival: 'Mars arrival: about 6–9 months after launch.' },
  'mars-surface': { destination: 'mars', title: 'Earth to Mars', arrival: 'Arrived at Mars: down to the surface base.' },
};

/** Whether a mission type has a launch to show (Earth analog missions stay on the ground). */
export function hasLaunch(envId: EnvironmentId) {
  return envId in ROUTES;
}
const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
};
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches;
const serverMotionPreference = () => true;
const duration = 6400;

function Planet({ type, x, y, radius }: { type: Exclude<MissionDestination, 'iss'>; x: number; y: number; radius: number }) {
  const id = useId();
  const { color, shade } = destinations[type];
  return (
    <g transform={`translate(${x} ${y}) scale(${radius / 50})`}>
      <defs>
        <radialGradient id={`${id}-light`} cx="30%" cy="22%" r="78%">
          <stop stopColor={color} /><stop offset="1" stopColor={shade} />
        </radialGradient>
        <clipPath id={`${id}-edge`}><circle r="50" /></clipPath>
      </defs>
      <circle r="50" fill={`url(#${id}-light)`} stroke={color} strokeOpacity=".5" />
      <g clipPath={`url(#${id}-edge)`}>
        {type === 'earth' && <>
          <path d="M-50-20L-31-33-14-32-17-18-5-12-12-3-23 1-18 13-30 8-39-4ZM-16 10L-1 14 8 26-1 44-10 34ZM13-37L38-31 49-18 37-6 19-10 9-2 5-17ZM17-5L35 0 29 27 19 22 11 10Z" fill="#78bf8f" />
          <path d="M-58-14Q-22-28 14-19T58-23M-56 23Q-21 11 2 21T54 17" fill="none" stroke="#dcf5ff" strokeWidth="4" opacity=".55" />
        </>}
        {(type === 'moon' || type === 'mars') && (
          <g fill={shade} opacity=".48">
            <ellipse cx="-21" cy="-19" rx="13" ry="8" /><ellipse cx="18" cy="14" rx="17" ry="11" />
            <circle cx="14" cy="-26" r="6" /><circle cx="-18" cy="28" r="8" />
          </g>
        )}
        {type === 'mars' && <path d="M-32-43Q-1-30 28-43L23-52H-19Z" fill="#f6d8c6" opacity=".8" />}
      </g>
    </g>
  );
}

function Station({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-47 0H48M-29-32V32M29-32V32M0-25V21" stroke="#cbd5e1" strokeWidth="3" />
      <g fill="#275596" stroke="#93c5fd">
        <path d="M-56-30H-34V-5H-56ZM-26-30H-4V-5H-26ZM4-30H26V-5H4ZM34-30H56V-5H34Z" />
        <path d="M-56 5H-34V30H-56ZM-26 5H-4V30H-26ZM4 5H26V30H4ZM34 5H56V30H34Z" />
      </g>
      <rect x="-11" y="-8" width="22" height="16" rx="3" fill="#e2e8f0" />
      <path d="M0 8V20" stroke="#bae6fd" strokeWidth="6" />
    </g>
  );
}

const stars = Array.from({ length: 70 }, (_, index) => ({
  x: (index * 97 + 23) % 640, y: (index * 53 + 19) % 300, size: index % 8 === 0 ? 1.5 : 0.65,
}));

function FlightScene({ destination, playing }: { destination: MissionDestination; playing: boolean }) {
  const orbit = destination === 'earth';
  const station = destination === 'iss';
  const lunar = destination === 'moon';
  const earthX = orbit ? 315 : 76;
  const earthY = orbit ? 164 : 244;
  const path = orbit
    ? 'M315 111 C296 77 232 83 224 141 C209 213 391 247 411 169 C425 123 397 96 363 96'
    : station
      ? 'M76 200 C93 96 265 72 408 117 C470 136 511 217 535 162'
      : lunar
        ? 'M76 200 C97 67 300 77 450 149 C489 232 625 210 603 122 C598 96 582 78 563 68'
        : 'M76 200 C97 67 297 71 418 134 C475 164 514 205 585 190';
  const endX = orbit ? 363 : station ? 535 : lunar ? 563 : 585;
  const endY = orbit ? 96 : station ? 162 : lunar ? 68 : 190;
  const endAngle = orbit ? 180 : station ? -66 : lunar ? -152 : -12;

  return (
    <svg viewBox="0 0 640 300" aria-hidden="true" className="block w-full">
      {stars.map(({ x, y, size }, index) => <circle key={index} cx={x} cy={y} r={size} fill="#b9e2fb" opacity={index % 4 / 5 + 0.2} />)}
      <Planet type="earth" x={earthX} y={earthY} radius={orbit ? 53 : 44} />
      {station && <Station x={535} y={132} />}
      {destination !== 'iss' && destination !== 'earth' && (
        <Planet type={destination} x={536} y={128} radius={47} />
      )}
      <path d={path} fill="none" stroke="#7dd3fc" strokeDasharray="4 6" opacity=".55" />
      <g transform={playing ? undefined : `translate(${endX} ${endY}) rotate(${endAngle})`}>
        {playing && <animateMotion path={path} dur={`${duration}ms`} rotate="auto" fill="freeze" />}
        {playing && <path d="M-9-3Q-24-5-28 0Q-21 6-9 3Z" fill="#fbbf24" />}
        <path d="M-11-5L-6-11 2-6 2 6-6 11-11 5Z" fill="#38bdf8" />
        <path d="M-12-5H4Q11-5 16 0Q11 5 4 5H-12Z" fill="#e2e8f0" />
        <circle cx="5" r="2.5" fill="#256b96" />
      </g>
      <text x={earthX} y={orbit ? 237 : 296} fill="#d0eafd" textAnchor="middle" fontSize="14">Earth</text>
    </svg>
  );
}

/** Plays the launch for the current mission type; nothing for Earth analog or no mission. */
export function MissionLaunch({ envId, missionName }: { envId: EnvironmentId; missionName?: string }) {
  const [run, setRun] = useState(0);
  const route = ROUTES[envId];
  if (!route) return null;
  return (
    <ModuleCard title="Mission launch" intro={`${missionName ? `${missionName}: ` : ''}${route.title}. Change the mission type below to fly a different route.`}>
      <MissionFlight key={`${envId}-${run}`} destination={route.destination} arrival={route.arrival} replay={() => setRun((previous) => previous + 1)} />
    </ModuleCard>
  );
}

function MissionFlight({ destination, arrival, replay }: { destination: MissionDestination; arrival: string; replay: () => void }) {
  const reducedMotion = useSyncExternalStore(subscribe, prefersReducedMotion, serverMotionPreference);
  const [phase, setPhase] = useState(0);
  const playing = !reducedMotion && phase < 3;
  const mission = destinations[destination];
  useEffect(() => {
    if (reducedMotion || phase >= 3) return;
    const times = [1550, 3300, 1550];
    const timeout = window.setTimeout(() => setPhase((previous) => previous + 1), times[phase]);
    return () => window.clearTimeout(timeout);
  }, [phase, reducedMotion]);

  const status = !playing ? arrival : phase === 0 ? 'Liftoff from Earth' : phase === 1 ? 'In transit' : 'Approaching destination';
  return (
    <div className="mt-4">
      <figure className="overflow-hidden rounded-xl border border-sky-400/20 bg-[#070b16]">
        <figcaption className="flex flex-wrap justify-between gap-2 px-4 pt-3 text-sm">
          <span className="font-semibold text-sky-200">{mission.name}</span>
          <span role="status" className="text-slate-200">{status}</span>
        </figcaption>
        <FlightScene destination={destination} playing={playing} />
      </figure>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {playing && <button className={button} type="button" onClick={() => setPhase(3)}>Skip to arrival</button>}
        {!reducedMotion && <button className={button} type="button" onClick={replay}>Replay mission</button>}
        <p className="text-xs text-slate-400">Illustrative route · distances and travel time are compressed.</p>
      </div>
    </div>
  );
}
