# AstroMed: Space Apps project page, field by field

Paste each block into the matching field. Deadline: **Sunday, November 15, 11:59 p.m.** (local time of your event).

---

## Project Name
```
AstroMed
```
(Your form currently says "Project AstroMed"; either works. "AstroMed" matches the app and slides.)

---

## Summary  (≈180 words, under the 1,500-character limit)
```
AstroMed is a visual health self-assessment app for astronauts. On the way to Mars a message to Earth takes up to 24 minutes each way, so crews must check their own health and act first. AstroMed lets an astronaut log vitals, sleep, food, exercise, mood and symptoms in under a minute, run guided checkups built for space (reaction time, cabin air, Amsler grid vision check, balance after landing, an after-spacewalk check for the bends), and see every reading against their own normal range and mission. Each result comes with clear advice and one of four urgency levels worded for their distance from Earth, from self-care to contacting the flight surgeon now. It explains what changed in the astronaut's own data, tracks prescribed medicines and whether they help, plans meals from the food on board, and covers NASA's 5 hazards and 17 spaceflight risks. Every threshold and tip cites NASA standards, NASA Human Research Program evidence or peer-reviewed research. It works on phones and offline, keeps each person's data private, and never prescribes. This matters because the next crews will be their own first line of care.
```

---

## Project Demonstration (link)
Paste the public link to the 7-slide deck you upload (Google Slides/Drive with "Anyone with the link can view", or a PDF on Google Drive or Dropbox). Test it in a private browser window first. Slide content: see [SLIDES.md](SLIDES.md).

## Project (link)
```
https://astro-med-two.vercel.app
```
No password or registration needed: judges press **Try the demo** on the home page.

---

## Project Details
Paste this into the rich-text box (headings can be made bold with the toolbar).

**What it does**
AstroMed is a health self-assessment tool for astronauts on missions far from Earth. It turns daily self-checks into clear answers: is this normal for me, here, and what should I do now?

- **Daily log (under a minute):** heart rate, blood pressure, temperature, oxygen saturation, blood sugar, sleep, exercise, water, food energy, weight, spacewalk hours, mood, stress and symptoms. Readings can also come from a photo of a device screen (read on the device), a smartwatch CSV, or lab reports.
- **11 guided checkups** with step-by-step instructions: vital signs, sleep, exercise, mood and team, a vision check with an interactive Amsler grid, a 3-minute reaction-time test (NASA's PVT-B), an adaptive speed-of-processing drill, cabin air and noise against NASA limits, a balance and stand-up test after gravity changes, an after-spacewalk check for decompression sickness, and a weekly immune and infection check.
- **My vitals:** interactive charts against the astronaut's own normal range, color-coded with an icon and a label, plus "what changed" explanations that point to the likely contributors in their own logs (short sleep, stress, missed exercise, low water, high cabin CO₂) and a practical next step.
- **Problems and advice:** describe a problem in plain words, with a photo; AstroMed matches it to about 80 NASA-listed spaceflight conditions, gives self-care steps and warning signs, flags emergencies instantly, and tracks whether it is getting better.
- **Distance-aware urgency:** four levels (self-care, next conference, flight surgeon today, act now). On Mars the crew medical officer acts first; in orbit the flight surgeon is a call away.
- **Medicines:** astronauts add medicines once the dose is confirmed with their doctor, with flexible schedules (daily, weekly or chosen days, every few days, as needed), reminders, a dose log, side-effect notes, and an automatic "is it helping?" comparison of their own readings before and after starting.
- **Food and exercise:** exercise calories from the Compendium of Physical Activities, the foods they have on board, their own diet plan, and suggestions that close calorie or protein gaps using foods they actually have, including warnings when supplies will run out.
- **Spaceflight risks:** NASA's 5 hazards and 17 risks, each linked to where AstroMed tracks it, plus "hidden risks" that start without symptoms (neck-vein clots, SANS, silent virus reactivation, space anemia, kidney stones), with how they're detected.
- **Body map, projections and more:** a clickable body figure, radiation dose against NASA's 600 mSv career limit, bone-loss projection, NASA's energy equation, Sleep orbit, brain-health tips and drill, a private journal with a self-harm safety check, breathing exercises and games, XP, ranks and streaks, My summary with questions for the flight surgeon, and Ask AstroMed for questions about your own data.

**How it works**
Every rule is explicit and cited: thresholds and tips link to the exact page of NASA-STD-3001, a NASA Human Research Program evidence report, a NASA technical brief, or a peer-reviewed study. Personal baselines start from real recordings (the MMASH dataset) and switch to the astronaut's own readings after 7 days. Five mission environments (Earth analog, low Earth orbit, lunar surface, Mars transit, Mars surface) change radiation, gravity effects and signal delay. 115 automated tests check the safety-critical rules.

**Benefits and intended impact**
Astronauts get immediate, explainable guidance when the ground is minutes away; flight surgeons get cleaner self-reports and a ready list of questions. The same tool could serve analog missions (Antarctic stations, HERA, CHAPEA) and people on Earth who are far from care.

**What makes it creative**
Advice that changes with distance from Earth; explanations drawn from the astronaut's own data rather than generic warnings; space-specific self-tests in a phone app (Amsler grid, reaction time, stand-up and balance tests); a before-and-after "is my medicine helping?" check; meal suggestions built from the food actually on board; and an animated mission home and launch to keep long missions engaging.

**Factors we considered**
Safety (no diagnosis, no medicine or dose recommendations, emergencies always escalate, severe side effects go straight to the flight surgeon); evidence (every number cited and checked against the source); privacy (each person sees only their own data, row-level security, private file storage, data export); no ongoing cost (rules and on-device text reading, no paid AI; an optional AI photo analysis uses the astronaut's own key); accessibility (color always with an icon and label, keyboard support, reduced-motion support); and real mission constraints (offline use, signal delay, small cabins, weightlessness).

**Demo vs. signed-in use**
- *Demo (no account):* a sample Mars transit mission on day 59 with two weeks of readings, problems, sleep and journal entries, so every feature has something to show. Data stays in the browser for 7 days and is cleared when you leave the demo.
- *Signed in:* starts empty with a Getting started guide; data is saved privately to the astronaut's account for at least 5 years, photos and documents go to private storage, baselines become their own after 7 days, and everything can be exported.

**Tools and languages**
TypeScript, Next.js 15 and React 19, Tailwind CSS, Supabase (Postgres with row-level security, sign-in, private storage), Vercel hosting, tesseract.js for on-device text reading, Lucide icons, Zod and Vitest. Installable web app that works offline on phones and laptops.

---

## Use of Super Intelligence (SI): options to tick
Tick these:
- **Coding, Debugging, or Troubleshooting**: code written with an AI coding assistant (Claude, by Anthropic), reviewed and tested by me.
- **Writing, Editing, or Translation**: in-app text, documentation and this submission were drafted and edited with AI help.
- **Research or Information Gathering**: AI helped find, extract and cross-check figures and page numbers from NASA PDFs and research papers; every source was checked against the original.
- **Building SI/ML Into the Project**: only if you want to count the optional "analyze a photo with your own AI key" feature (off by default). It's honest to tick it.

Your choice:
- **Ideation or Brainstorming**: the core idea was yours; tick it only if you count AI suggestions for extra features (for example, the extra space checks).

Leave unticked: **Data Analysis and Interpretation** (the app's analysis is fixed rules you specified), unless you want to count the checking of numbers above.

Images: the home page picture and the My body figure were generated with ChatGPT and carry a visible "AI-generated image (ChatGPT)" watermark in the app. If any slide uses them, keep that label visible on the slide.

---

## NASA Data (Link Text → Link Url)
| Link Text | Link Url |
|---|---|
| NASA-STD-3001 Human Spaceflight Standards (Volumes 1 and 2, and technical briefs) | https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/ |
| NASA Human Research Program (hazards and risks of human spaceflight) | https://www.nasa.gov/hrp/ |
| NASA Human Research Roadmap: evidence reports | https://humanresearchroadmap.nasa.gov/evidence/ |

## Space Agency Partner & Other Data (Link Text → Link Url)
| Link Text | Link Url |
|---|---|
| Canadian Space Agency: Monitoring radiation for astronaut health | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| MMASH dataset (PhysioNet) | https://physionet.org/content/mmash/1.0.0/ |
| Compendium of Physical Activities | https://pacompendium.com/ |
| Peer-reviewed spaceflight and brain-health research (full list with links) | https://astro-med-two.vercel.app/about |
| Next.js | https://nextjs.org |
| Supabase | https://supabase.com |
| Vercel | https://vercel.com |
| Tailwind CSS | https://tailwindcss.com |
| Lucide icons | https://lucide.dev |
| tesseract.js | https://github.com/naptha/tesseract.js |
| Claude Code (AI coding assistant) | https://claude.com/claude-code |
| ChatGPT (two labelled illustrations) | https://chatgpt.com |

---

## Before you press "Submit for Judging"
- [ ] Open both links in a private browser window: the app and **Try the demo** work without a login; the slides open without permission.
- [ ] Slides: at most 7, in English, with team name (AstroMed), member (Srija Dasgupta) and the challenge; AI images keep their watermark.
- [ ] Tick **Agree to Terms and Conditions** and **Confirm All Work is Original**, then press **Submit for Judging** before 11:59 p.m. Sunday.
- [ ] Optional: request a FortiGuard Web Filter Classification for astro-med-two.vercel.app (category: web-based application; company: N/A).
