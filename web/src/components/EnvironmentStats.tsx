import type { MissionEnvironment } from "@/lib/environments";

export function EnvironmentStats({ env }: { env: MissionEnvironment }) {
  const stats = [
    ["Gravity", env.gravity],
    ["Radiation", env.radiation],
    ["Signal delay", env.commDelay],
    ["Duration", env.typicalDuration],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {stats.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="text-slate-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
