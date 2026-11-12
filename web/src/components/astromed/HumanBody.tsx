"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { button, inset, ModuleCard } from "./ui";
import styles from "./motion.module.css";

// Each system links to the indicators in the guide that check it.
const systems = [
  { name: "Heart and blood vessels", color: "#fb7185", point: [107, 108], path: "M100 78V158M100 95L74 101 48 160M100 95L126 101 152 160M100 154L84 188 77 262M100 154L116 188 123 262M102 105C89 94 83 110 108 126C132 110 124 94 112 104L108 109Z",
    detail: "The heart and blood vessels carry oxygen and nutrients around the body. Heart rate and blood pressure describe different parts of how well that is working.",
    indicators: [["blood-pressure", "Blood pressure"], ["heart-rate", "Heart rate and HRV"], ["water", "Water intake"]] },
  { name: "Lungs and breathing", color: "#38bdf8", point: [83, 103], path: "M100 72V98M100 93L86 105M100 93L114 105M93 92C76 92 70 114 72 131C82 135 91 130 93 124ZM107 92C124 92 130 114 128 131C118 135 109 130 107 124Z",
    detail: "The lungs take in oxygen and remove carbon dioxide. In a closed cabin, smoke, dust or a leak affects everyone, so AstroMed treats trouble breathing as an emergency.",
    indicators: [["symptoms", "Symptoms and problems"], ["temperature", "Body temperature"]] },
  { name: "Brain, nerves and eyes", color: "#c4b5fd", point: [100, 40], path: "M100 54V162M100 92L70 109 45 165M100 92L130 109 155 165M100 162L85 190 77 258M100 162L115 190 123 258M87 39Q86 27 100 28Q113 27 114 39Q116 50 100 53Q84 49 87 39Z",
    detail: "The brain, spinal cord and nerves control sensation, movement, balance, sleep and mood. The eyes are checked too, because vision can change during long flights.",
    indicators: [["sleep", "Sleep"], ["mood", "Mood and stress"], ["vision", "Vision"]] },
  { name: "Bones and muscles", color: "#fbbf24", point: [118, 195], path: "M73 96L87 82 100 90 113 82 127 96M100 90V155M76 108Q100 125 124 108M76 119Q100 136 124 119M75 151Q100 169 125 151M73 96L61 135 47 162M127 96L139 135 153 162M86 167L82 218 77 266M114 167L118 218 123 266",
    detail: "Bones and muscles hold you up and move you. Without gravity they carry less load, so daily exercise and enough food matter more.",
    indicators: [["fitness", "Exercise, bone and muscle"], ["nutrition", "Food and weight"]] },
] as const;

export function HumanBody() {
  const [active, setActive] = useState(0);
  const panel = useId();
  const system = systems[active] ?? systems[0];
  return (
    <ModuleCard title="Body systems at a glance" intro="Pick a system to see which indicators check it.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[radial-gradient(ellipse_at_center,#142944,#0c1425_70%)]">
          <svg viewBox="0 0 200 300" role="group" aria-label="Body outline with selectable systems" className="mx-auto block h-72 w-full max-w-64">
            <g fill="none" stroke="#28435e">
              <circle cx="100" cy="140" r="76" strokeDasharray="2 5" />
              <path d="M100 8V286M12 140H188" strokeDasharray="3 6" />
            </g>
            <path d="M100 18C85 18 79 30 82 44Q83 56 92 63L91 72 72 77Q62 80 58 94L47 132 37 161Q32 173 41 177Q48 179 54 166L69 137 73 119 74 146 69 175 72 214 67 263 61 276Q62 282 83 278L88 264 95 219 100 182 105 219 112 264 117 278Q138 282 139 276L133 263 128 214 131 175 126 146 127 119 131 137 146 166Q152 179 159 177Q168 173 163 161L153 132 142 94Q138 80 128 77L109 72 108 63Q117 56 118 44C121 30 115 18 100 18Z" fill="#10233a" stroke="#4a7494" />
            {systems.map(({ name, path, color }, index) => (
              <path key={name} d={path} fill="none" stroke={color} strokeWidth={active === index ? 2.4 : 1}
                strokeLinecap="round" strokeLinejoin="round" opacity={active === index ? 1 : 0.15} className={styles.anatomy} aria-hidden="true" />
            ))}
            {systems.map(({ name, point: [x, y], color }, index) => (
              <g key={name} role="button" tabIndex={0} aria-label={name} aria-pressed={active === index} aria-controls={panel}
                className={styles.hotspot} onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(index);
                  }
                }}>
                <circle cx={x} cy={y} r="12" fill="transparent" />
                <circle cx={x} cy={y} r={active === index ? 5 : 3} fill={color} stroke="#070b16" />
              </g>
            ))}
          </svg>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Body systems">
            {systems.map(({ name }, index) => (
              <button key={name} type="button" aria-controls={panel} aria-pressed={active === index}
                onClick={() => setActive(index)} className={`${button} aria-pressed:border-sky-300 aria-pressed:bg-sky-400/25`}>{name}</button>
            ))}
          </div>
          <div id={panel} aria-live="polite" className={inset}>
            <div key={system.name} className={styles.reveal}>
              <h3 className="font-semibold" style={{ color: system.color }}>{system.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{system.detail}</p>
              <p className="mt-3 text-xs text-slate-500">Indicators that check it</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {system.indicators.map(([id, label]) => (
                  <li key={id}><Link href={`#${id}`} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-sky-300 hover:bg-white/10 hover:text-sky-200">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
