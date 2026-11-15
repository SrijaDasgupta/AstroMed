# AstroMed: Space Apps project page, ready to paste

Every required field of the 2026 Project Submission form, in order. Deadline: **Sunday, November 15, 11:59 p.m.** local time of your Local Event.

---

## Project Name
AstroMed

## High-Level Project Summary
AstroMed is a visual health self-assessment web app for astronauts. On the way to Mars, a message to Earth takes up to 24 minutes each way, so crews must check their own health and act first. Astronauts log vitals, sleep, food, exercise and mood in under a minute, or follow guided checkups made for space: a 3-minute reaction-time test, a cabin air and noise check, an Amsler grid for eye changes, a balance and stand-up test after gravity changes, and an after-spacewalk check for decompression sickness. Each reading is shown against the astronaut's own normal range and mission, colour-coded with an icon and a label, and every result comes with one of four urgency levels worded for their distance from Earth. All thresholds and advice cite NASA's crew health standards and Human Research Program evidence, covering all five hazards and 17 risks of human spaceflight. It gives guidance on self-care and health improvement, never diagnoses or recommends medicines, and works on phones and offline.

## Link to Project Demo
Paste the public link to the demo you upload yourself (up to 7 slides including title and intro, or a video of 30 seconds or less). The slides must show the team name (AstroMed), team member (Srija Dasgupta) and the challenge.

## Link to Final Project
https://astro-med-two.vercel.app
(Press **Try the demo**: no account, password or registration needed.)

## Detailed Project Description

**What it does**
- **Daily log** (under a minute): heart rate, blood pressure, temperature, oxygen saturation, blood sugar, sleep, exercise, water, food energy, spacewalk hours, weight, mood, stress and symptoms.
- **Guided checkups** with step-by-step instructions: vital signs, sleep, exercise, mood and team, vision (interactive Amsler grid), 3-minute reaction-time test (NASA's PVT-B), cabin air and noise (CO₂, temperature, humidity, noise against NASA-STD-3001 limits), balance and stand-up test, after-spacewalk check (comes due after each logged spacewalk), weekly immune and infection check.
- **My vitals**: interactive charts against the astronaut's own normal range, a live heartbeat at their own heart rate, a Sleep orbit, and a Space checks summary.
- **Alerts and who to contact**: four urgency levels (no action, next conference, flight surgeon today, act now). On Mars the crew medical officer acts first; in orbit the flight surgeon is a call away.
- **Problems & advice**: describe a problem in plain words, optionally with a photo; AstroMed matches it to about 80 NASA-listed spaceflight conditions, flags emergency phrases instantly, and gives self-care steps and warning signs, then tracks whether it is getting better or worse.
- **Spaceflight risks**: NASA HRP's 5 hazards and 17 risks, each linked to NASA's page and to the check in AstroMed that tracks it, plus **hidden risks** that can start without symptoms (clots in the neck veins, SANS, silent virus reactivation, space anemia, silent kidney stones), with how they're detected and what to watch for.
- **Projections**: radiation dose against NASA's 600 mSv career limit, bone loss, and a nutrition target from NASA's energy equation (with extra for spacewalks).
- **Body map**: a clickable anatomical figure showing what spaceflight does to each part and the astronaut's own data.
- **Photo import**: reads text from device screens, lab reports, dosimeters and sleep trackers on the device (no upload, no AI) and adds readings to My vitals. Smartwatch CSV import and lab report uploads too.
- **Brain health**: tips on speed-of-processing training, reactive exercise, daily novelty, balance with a thinking task and 2-minute movement breaks, each citing peer-reviewed research and adapted for life in a habitat, plus an adaptive in-app Speed drill modelled on the speed-of-processing training in those trials.
- **Mental health and routine**: private journal with a self-harm safety check, breathing exercises and mini-games, medicine tracking (confirmed doses, reminders, doses taken, side effects, and whether it's helping, compared before and after starting; no dosing advice), habit missions, XP, ranks, streaks and badges.
- **My summary**: physical, mental and routine health in one place, with suggestions and questions to take to the flight surgeon.
- **Five mission environments**: Earth analog, low Earth orbit, lunar surface, Mars transit and Mars surface, each changing radiation, gravity and signal delay.

**How it works**
Rules, not a black box: every threshold is a fixed rule with a page-level citation to a NASA standard or evidence report, and 104 automated tests check the safety-critical ones (emergency detection, urgency levels, contact by distance, NASA's energy equation, cabin limits, decompression sickness signs, the self-harm check). Personal baselines start from real recordings in the MMASH dataset and switch to the astronaut's own readings after 7 days.

**Benefits**
Astronauts get an immediate, explainable answer to "is this normal for me, here, and what should I do now?", which matters most when the ground is minutes away. Flight surgeons get cleaner self-reports and a summary of questions.

**What we hope to achieve**
A crew-tested self-assessment tool for the Artemis and Mars era, validated with flight surgeons and analog missions (Antarctic stations, HERA, CHAPEA), and the same self-checks for people on Earth who are far from care.

**Tools and languages**
TypeScript, Next.js 15, React 19, Tailwind CSS, Supabase (Postgres with row-level security, sign-in, private file storage), Vercel hosting, tesseract.js (on-device text reading), Lucide icons, Zod, Vitest. Works as an installable, offline-capable web app on phones and laptops.

## Use of Super Intelligence (SI)
Yes. The idea, the choice of NASA sources and all product decisions are mine. I used an AI coding assistant (Claude, by Anthropic, through Claude Code) to help write the code, text and data files, and to extract and check numbers and page references from the NASA PDFs. I reviewed and tested all of it, including 104 automated tests. No AI-generated images, video or audio are used; all graphics are drawn in code. This is acknowledged in the project on the About page (https://astro-med-two.vercel.app/about), in the README, and in the site's metadata (an "ai-assistance" meta tag). Inside the app, advice comes from fixed rules, not AI; an optional photo analysis uses AI only if the user connects their own API key.

## NASA Data
- **NASA-STD-3001 Volume 1, Revision C: Crew Health**: the list of about 80 spaceflight conditions (Table E.2-2), monitoring requirements for vital signs, sleep, fitness, behavioral health, sensorimotor function, immune function and eye changes (SANS), the 600 mSv career radiation limit.
- **NASA-STD-3001 Volume 2, Revision F: Human Factors, Habitability and Environmental Health**: cabin CO₂ limit (3 mmHg), temperature and humidity ranges, noise limits, NASA's energy equation, 2.5 L daily water minimum, decompression sickness signs and treatment.
- **NASA Human Research Program evidence reports**: Sleep (3-minute PVT-B), Cardiovascular, Behavioral Health and Performance, Bone Fracture (1–1.5% bone loss a month), Radiation Carcinogenesis.
- **NASA HRP Risks of Human Spaceflight** (5 hazards, 17 risks) and the **Risk of Hypoxia** page.
- **NASA Pharmaceutical Care technical brief** (OCHMO-MTB-012), for the medicine safety notes.

## Space Agency Partner Data and Other References
- **Canadian Space Agency (CSA)**: "Monitoring radiation for astronaut health" (2026): neutrons are about 30% of the ISS radiation dose.
- **MMASH dataset** (Rossi et al., 2020; PhysioNet, ODC-BY 1.0): real heart rate, heart rate variability, sleep and mood recordings used as starting baselines.
- **Spaceflight research** (for the hidden risks): Marshall-Goebel et al. 2019, jugular flow and clots (JAMA Network Open); Brunstetter et al. 2025, predicting SANS (JAMA Ophthalmology); Mehta et al. 2017, latent virus reactivation (npj Microgravity); Trudel et al. 2022, hemolysis and space anemia (Nature Medicine); Goodenow-Messman et al. 2022, kidney stone risk (npj Microgravity); Buckey et al. 2023, bone loss and kidney stones (Current Opinion in Nephrology and Hypertension); NASA Fundamentals of Human Health, urinary health brief.
- **Brain health research** (for the Brain health tips): Coe et al. 2026, ACTIVE 20-year follow-up (Alzheimer's & Dementia: TRCI); Attarha et al. 2025, INHANCE trial (JMIR Serious Games); Gu et al. 2019, open vs. closed skill exercise review (Frontiers in Psychology); Li et al. 2024, open/closed skill fNIRS study (Scientific Reports); Zong et al. 2022 (Frontiers in Aging Neuroscience); Brandeis University news release on novelty and brain health (2026); Park 2021, dual-task training trial (Brain & NeuroRehabilitation); Li et al. 2018, balance and dual-tasking review (Frontiers in Neurology); Carter et al. 2018, walking breaks and brain blood flow (Journal of Applied Physiology); Dunstan et al. 2012, breaking up sitting (Diabetes Care).
- **Open-source software**: Next.js, React, TypeScript, Tailwind CSS, Supabase, tesseract.js and its English language data (Apache 2.0), Lucide icons (ISC), Zod, Vitest, Anthropic SDK (optional feature).
- **Hosting**: Vercel. **Database**: Supabase.
- No copyrighted images are used. No NASA logos or branding are used. No images of people.
- Full list with links: https://astro-med-two.vercel.app/about

---

## Before you press "Submit for Judging"
- [ ] Open both links in a private browser window to confirm they work without a login.
- [ ] Check the boxes for "Terms and Conditions" and "Confirm All Work is Original".
- [ ] Optional: request a FortiGuard Web Filter Classification for astro-med-two.vercel.app (Category: web-based application or education; Company Name: N/A) so judges' networks don't block it.
- [ ] Optional: record the 30-second video in DEMO_SCRIPT.md if you'd rather submit a video than slides.
