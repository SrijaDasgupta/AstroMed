# AstroMed

**A health self-assessment tool for astronauts on missions beyond Earth.**

AstroMed helps an astronaut check their own health during a mission, understand what the readings mean in their environment (space station, Moon base or rover, Mars transit or surface), and know what to do and how soon: handle it themselves, raise it at the next check-in, involve the flight surgeon today, or act now with the crew.

Built for the NASA Space Apps Challenge brief *"create a visual tool that helps astronauts assess their own health during space missions and provides guidance on treatments and health improvements."*

> **Try it:** open the live site and press **Try the demo**. It starts on a sample astronaut, day 59 of the *Ares Transit 1* Mars mission, with two weeks of data, so every feature has something to show. No account needed.
>
> Live site: **https://astro-med-two.vercel.app**

---


## Space Apps submission
- Live app: https://astro-med-two.vercel.app (press **Try the demo**, no account needed)
- Data, sources and AI use: https://astro-med-two.vercel.app/about
- Paste-ready project page text: [docs/SUBMISSION.md](docs/SUBMISSION.md); 30-second video script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)

## Use of AI
The idea, the choice of NASA sources and all product decisions are the team's own. Code, text and data files were written with the help of an AI coding assistant (Claude, by Anthropic) and reviewed and tested by the team. No AI-generated images, video or audio are used; all graphics are drawn in code. This is also stated on the /about page and in the site metadata. Inside the app, advice comes from fixed NASA-cited rules, not AI.

## How AstroMed answers the challenge

| The brief asks | AstroMed |
|---|---|
| A visual tool to assess your own health | Dashboard, **My vitals** charts against your own normal range, and **My summary** of physical, mental and routine health |
| The five hazards of spaceflight | About 80 NASA-listed conditions grouped under radiation, isolation and confinement, distance from Earth, altered gravity, and hostile closed environments; a **Spaceflight risks** page maps NASA HRP's 5 hazards and 17 risks to NASA's pages and to where AstroMed tracks each one |
| Blood pressure, heart rate, blood sugar, temperature, sleep, mood | All six in the **Daily log** and guided **Checkups** (blood sugar in mg/dL), plus oxygen saturation (SpO₂), heart rate variability, stress, water, food energy, weight and exercise |
| Proactive checks for the space environment | **Space checks**: a 3-minute reaction-time test (NASA's PVT-B) for alertness, compared with your own usual speed; a **cabin air and noise** log checked against NASA-STD-3001 limits (CO₂ ≤ 3 mmHg, 18–27 °C, 25–75% humidity, 85 dBA); a weekly **Amsler grid** vision check for SANS; oxygen saturation with low-oxygen alerts; a **balance and stand-up test** after gravity changes (orthostatic intolerance and balance, with a stand timer and stopwatch); an **after-spacewalk check** that comes due after each logged spacewalk and treats any sign of the bends as urgent; and a weekly **immune and infection check** (shingles, cold sores, infected cuts, urinary infection, hygiene) |
| Brain health | A **Brain health** tips topic: speed-of-processing training, reactive exercise, daily novelty, balance with a thinking task and 2-minute movement breaks, each citing peer-reviewed studies (ACTIVE, INHANCE and others) and adapted for a habitat, plus daily habit missions; an in-app adaptive **Speed drill** (centre object plus a star at the edge, with the flash getting shorter as you improve) that ticks off the speed-training habit after 10 minutes |
| Hidden risks | A **Hidden risks** section on the Spaceflight risks page for problems that can start without symptoms: clots in the neck veins, SANS, silent virus reactivation, space anemia and silent kidney stones. Each explains how flight surgeons detect it (ultrasound, OCT, saliva and urine tests, breath CO, urine chemistry) and the self-checks AstroMed adds (neck and kidney symptoms in the daily log, anemia questions after landing), citing the primary studies |
| Bone loss, cardiovascular events, immune changes, nutrition, behavioral health | Bone-loss and radiation projections, cardiovascular alerts, immune warning signs, NASA's energy formula with food and weight tracking, mood, stress and a private journal |
| Any input: keyboard, clicks, camera | Forms, sliders, free-text problem reports, photos (camera or library), **Photo import** (reads any health photo on the device, no AI or key: device screens, lab reports, dosimeters and sleep trackers, pulling out readings such as blood pressure, which can be added straight to My vitals and its alerts), smartwatch CSV import, lab report uploads |
| When should the crew or flight surgeons get involved? | Every result carries one of four urgency levels, and the wording changes with distance: on a Mars mission (4–24 minute signal delay) the crew medical officer acts first and reports to the ground |
| Guidance on treatment and improvement | Self-care steps, warning signs, NASA-cited tips, an exercise plan for the mission type, and questions to take to the flight surgeon. No medicine recommendations, by design |
| Which measurements, why an exam, how hazards affect them, when to get help, how to prevent problems | The **Health indicators guide** answers all five for 12 indicators (blood pressure, heart rate and HRV, blood sugar, temperature, sleep, mood, food and weight, water, vision, exercise and bone, radiation dose, symptoms), each with NASA citations and the astronaut's own latest reading; guided checkups walk through each measurement |
| A clickable human figure | **My body**: an anatomical figure; tap any part to see what spaceflight does to it and your own data; red pins mark your reported problems |
| Different environments | Earth analog, low Earth orbit (space station), lunar surface (base or rover), Mars transit (spacecraft), Mars surface (base or rover); the Mission page plays an animated launch along the route to your mission destination |
| Food and exercise | Log meals and exercise sessions; exercise calories are estimated from the 2024 Compendium of Physical Activities and your weight. Add the foods you have on board and build a diet plan; AstroMed checks it against NASA's energy need and a protein target and suggests foods from what you have, including when a food will run out before the mission ends |
| Medicine tracking | Add a medicine once the dose is confirmed with your flight surgeon or doctor; set how often (every day, chosen days such as a weekly dose, every N days, or as needed), get reminders only on the days it's due, tick doses taken, note side effects, and see whether it's helping: AstroMed compares the measure it's for (sleep, blood pressure, headaches and more) in the 2 weeks before and after you started. Severe side effects and emergencies always point to the flight surgeon |
| Prompts as part of the routine | Checkups that come due, medicine and routine reminders with notifications, and today's habit missions |
| Gamification | XP, ranks from Cadet to Commander, streaks and badges |
| Dynamic charts | Interactive charts with hover, keyboard access and table views |
| Color coding | Green, amber and red, always with an icon and a label (not color alone) |
| Simple instructions | A Getting started guide with a self-ticking checklist, and plain-language explanations throughout |

## Main features

- **Problems & advice**: report anything in your own words, with a photo. AstroMed matches it against NASA's condition list, flags emergency phrases instantly, says how soon to involve the flight surgeon, and follows the problem as you add updates (better, worse or unchanged).
- **My summary**: physical, mental and routine health in one printable page, with ranked suggestions and questions for the flight surgeon.
- **Distance-aware advice**: who to contact, and how, depends on the mission's signal delay.
- **Nutrition**: daily food energy target from NASA's own equation (age, sex, weight, height, activity factor 1.25, plus 200 kcal per spacewalk hour), and alerts for shortfalls and weight loss.
- **Bring your own AI (optional)**: people can connect their own AI account (Claude, ChatGPT, Gemini, Grok, or any OpenAI-compatible service under "Other") to analyze problem photos. The key stays in their browser; photos go straight to the provider they chose, under their account, and every answer is checked against the same format before it's saved. AstroMed works fully without it.
- **Animated views**: a heartbeat sweep paced at your own resting heart rate and a **Sleep orbit** of when you slept and napped over the week, saved to your account (My vitals), radiation particles scaled to each environment's NASA dose rate, a place to compare your own dosimeter reading, and a dose-matching game with a shielded cabin (My exposure), a body-systems figure linked to the indicators (Health indicators guide), and a breathing exercise with two short games (Journal). All respect reduced-motion settings.
- **Works on phones and offline**: installable to the home screen; pages you've opened work without a connection; daily logs made offline are sent, with their real time, when you reconnect.

## Evidence and data

All guidance cites its source: a page in a NASA document (links open the PDF at that page) or a NASA or CSA web page:

- NASA-STD-3001 Vol. 1 Rev C (crew health) and Vol. 2 Rev F (human factors, habitability, environment), including Table E.2-2, the list of high-likelihood and high-consequence medical conditions for spaceflight
- Human Research Program evidence reports: sleep, cardiovascular, behavioral health, bone fracture, radiation carcinogenesis
- NASA Office of the Chief Health and Medical Officer technical brief on ISS pharmaceutical care
- NASA Human Research Program web pages: [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/), [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) (including the hypoxia risk page, the source for AstroMed's low-oxygen condition) and [Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- Canadian Space Agency: [Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) (neutrons are about 30% of ISS radiation) and [Why do we conduct science experiments in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
- Personal baselines start from the MMASH dataset (Rossi et al., 2020, PhysioNet, ODC-BY) until an astronaut has 7 days of their own readings

Absolute alert limits (for example very high blood pressure) are general clinical thresholds chosen for this demo and labeled as such; a real program's flight surgeons would set their own.

## Safety and privacy

- AstroMed supports self-monitoring. It does not diagnose and never recommends medicines or doses.
- Emergency phrases (chest pain, trouble breathing, stroke signs, fire or toxic leaks, thoughts of self-harm) always show an immediate "act now" message.
- Each person's data is visible only to them (database row-level security on every table; private file storage).
- 112 automated tests cover the safety-critical rules: emergency detection, urgency levels, crew-versus-ground contact, NASA's energy formula, and the self-harm check, and that every indicator in the guide answers all five questions with NASA sources.

## Run it yourself

```bash
cd web
npm install
cp .env.example .env.local   # add your Supabase URL and publishable key
npm run dev                  # http://localhost:3000
npm test                     # safety-rule tests
```

Database migrations are in `supabase/migrations/`. Without Supabase keys the app still runs in demo mode.

**Stack**: Next.js 15 (App Router, server actions), React 19, TypeScript, Tailwind CSS, Supabase (auth, Postgres, storage), deployed on Vercel.

## Limitations and next steps

- Problem text is read with keyword matching, not an AI model, so it errs on the side of flagging.
- Reminder notifications appear only while AstroMed is open in a browser tab.
- Offline mode keeps pages you've opened and queues daily logs; other forms still need a connection.
- Next: push notifications, more input devices (direct sensor and smartwatch sync), crew medical officer views, and validation with flight surgeons.
