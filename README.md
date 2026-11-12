# AstroMed

**A health self-assessment tool for astronauts on missions beyond Earth.**

AstroMed helps an astronaut check their own health during a mission, understand what the readings mean in their environment (space station, Moon base or rover, Mars transit or surface), and know what to do and how soon: handle it themselves, raise it at the next check-in, involve the flight surgeon today, or act now with the crew.

Built for the NASA Space Apps Challenge brief *"create a visual tool that helps astronauts assess their own health during space missions and provides guidance on treatments and health improvements."*

> **Try it:** open the live site and press **Try the demo**. It starts on a sample astronaut, day 59 of the *Ares Transit 1* Mars mission, with two weeks of data, so every feature has something to show. No account needed.
>
> Live site: **https://astro-med-two.vercel.app**

---

## How AstroMed answers the challenge

| The brief asks | AstroMed |
|---|---|
| A visual tool to assess your own health | Dashboard, **My vitals** charts against your own normal range, and **My summary** of physical, mental and routine health |
| The five hazards of spaceflight | About 80 NASA-listed conditions grouped under radiation, isolation and confinement, distance from Earth, altered gravity, and hostile closed environments |
| Blood pressure, heart rate, blood sugar, temperature, sleep, mood | All six in the **Daily log** and guided **Checkups** (blood sugar in mg/dL), plus heart rate variability, stress, water, food energy, weight and exercise |
| Bone loss, cardiovascular events, immune changes, nutrition, behavioral health | Bone-loss and radiation projections, cardiovascular alerts, immune warning signs, NASA's energy formula with food and weight tracking, mood, stress and a private journal |
| Any input: keyboard, clicks, camera | Forms, sliders, free-text problem reports, photos (camera or library), smartwatch CSV import, lab report uploads |
| When should the crew or flight surgeons get involved? | Every result carries one of four urgency levels, and the wording changes with distance: on a Mars mission (4–24 minute signal delay) the crew medical officer acts first and reports to the ground |
| Guidance on treatment and improvement | Self-care steps, warning signs, NASA-cited tips, an exercise plan for the mission type, and questions to take to the flight surgeon. No medicine recommendations, by design |
| Which measurements, and why an exam? | Guided checkups explain each step and why it matters in space, with NASA page citations |
| A clickable human figure | **My body**: an anatomical figure; tap any part to see what spaceflight does to it and your own data; red pins mark your reported problems |
| Different environments | Earth analog, low Earth orbit (space station), lunar surface (base or rover), Mars transit (spacecraft), Mars surface (base or rover) |
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
- **Bring your own AI (optional)**: people can connect their own Anthropic API key to analyze problem photos. The key stays in their browser; photos go straight to Anthropic under their account. AstroMed works fully without it.
- **Works on phones and offline**: installable to the home screen; pages you've opened work without a connection; daily logs made offline are sent, with their real time, when you reconnect.

## Evidence and data

All guidance cites a page in a NASA document (links open the PDF at that page):

- NASA-STD-3001 Vol. 1 Rev C (crew health) and Vol. 2 Rev F (human factors, habitability, environment), including Table E.2-2, the list of high-likelihood and high-consequence medical conditions for spaceflight
- Human Research Program evidence reports: sleep, cardiovascular, behavioral health, bone fracture, radiation carcinogenesis
- NASA Office of the Chief Health and Medical Officer technical brief on ISS pharmaceutical care
- Personal baselines start from the MMASH dataset (Rossi et al., 2020, PhysioNet, ODC-BY) until an astronaut has 7 days of their own readings

Absolute alert limits (for example very high blood pressure) are general clinical thresholds chosen for this demo and labeled as such; a real program's flight surgeons would set their own.

## Safety and privacy

- AstroMed supports self-monitoring. It does not diagnose and never recommends medicines or doses.
- Emergency phrases (chest pain, trouble breathing, stroke signs, fire or toxic leaks, thoughts of self-harm) always show an immediate "act now" message.
- Each person's data is visible only to them (database row-level security on every table; private file storage).
- 44 automated tests cover the safety-critical rules: emergency detection, urgency levels, crew-versus-ground contact, NASA's energy formula, and the self-harm check.

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
