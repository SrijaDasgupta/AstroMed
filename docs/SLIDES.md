# AstroMed: 7-slide demo deck

Space Apps rules: **7 slides at most, including title and intro**, in English, with team name, team member names and the challenge. Keep words short on screen; the bullets below are the on-slide text, and "Visual" says what to show.
Any slide using the two ChatGPT images must keep the "AI-generated image (ChatGPT)" label visible.

---

## Slide 1: Title
**AstroMed**
*Health self-assessment for the hazards of deep space*

- Team: AstroMed
- Team member: Srija Dasgupta
- Challenge: Create a visual tool that helps astronauts assess their own health during space missions and provides guidance on treatments and health improvements *(use the official challenge title from your Space Apps page if it's worded differently)*
- astro-med-two.vercel.app

Visual: the astronaut picture from the home page (with its AI label), or a screenshot of the animated mission home.

---

## Slide 2: The problem
**On the way to Mars, help is up to 24 minutes away**

- Missions are getting longer and farther: Artemis to the Moon, then Mars.
- A message to Earth takes 4–24 minutes each way, so crews must assess their own health and act first.
- NASA's 5 hazards: radiation · isolation and confinement · distance from Earth · altered gravity · hostile closed environments.
- Astronauts need answers, not raw numbers: *Is this normal for me, here? What do I do now, and who do I tell?*

Visual: the five hazards as five icons, with a signal-delay line from Earth to Mars.

---

## Slide 3: What AstroMed does
**Log in a minute. See what changed. Know what to do.**

- **Log:** vitals, oxygen, sleep, food, exercise, mood and symptoms in under a minute, or from a photo of a device screen.
- **Check:** 11 guided checkups built for space: reaction time, cabin CO₂ and noise, Amsler grid vision check, balance after landing, after-spacewalk check for the bends, immune check.
- **Understand:** every reading against *your own* normal range, colour plus icon plus label, with "what changed in your logs" (short sleep, stress, missed exercise, cabin CO₂).
- **Act:** four urgency levels, worded for your distance from Earth. On Mars the crew medical officer acts first.
- **Plus:** medicines with reminders, food and exercise tracking, body map, radiation and bone-loss projections, brain-health drill, private journal, My summary for the flight surgeon.

Visual: 3 phone screenshots: Daily log → My vitals chart → a "Contact today" result.

---

## Slide 4: Try it two ways: demo vs. your own account
| Demo (no account) | Signed in |
|---|---|
| Press **Try the demo** on the home page | Sign up with email, confirm, sign in |
| Sample Mars transit mission, day 59 | Starts empty, with a Getting started guide |
| Two weeks of sample readings, problems, sleep and journal, so every feature has data | Your own readings; your baseline becomes yours after 7 days |
| Kept in the browser for 7 days; cleared when you leave | Saved privately for at least 5 years; photos and documents in private storage |
| Explore freely | Export all your data any time |

Visual: the home page with the "Try the demo" button, beside the Getting started checklist.

---

## Slide 5: Safe and evidence-based, not guesswork
**Every suggestion comes from research, not random advice**

- **Cited at the page:** every threshold and tip links to NASA-STD-3001, a NASA Human Research Program evidence report, a NASA technical brief, or a peer-reviewed study.
- **Exercise and calories:** plans follow how NASA structures in-flight exercise; calories burned use the 2024 Compendium of Physical Activities; energy needs use NASA's own equation (+200 kcal per spacewalk hour).
- **Space checks from research:** NASA's 3-minute PVT-B alertness test, NASA cabin air limits, signs of the bends, plus hidden risks that start silently (neck-vein clots, SANS, virus reactivation, space anemia, kidney stones).
- **Reminders and logging:** medicines on the astronaut's confirmed schedule (daily, weekly, every few days, as needed), dose log, side effects, and an "is it helping?" comparison of their own readings.
- **Safety rules:** no diagnosis, no medicine or dose recommendations; emergencies always escalate; severe side effects go straight to the flight surgeon. 115 automated tests guard these rules.
- **Private by design:** each person sees only their own data.

Visual: a tip card with its NASA citation link, next to a medicine card showing "Looks like it's helping".

---

## Slide 6: What stands out
- **Advice that changes with distance from Earth:** orbit, Moon or Mars.
- **Explains your own data:** "your blood pressure rose; in your logs, stress was 4/5 on 2 of the last 3 days. Re-measure tomorrow morning."
- **Space self-tests on a phone:** Amsler grid, reaction time, stand-up and balance test, after-spacewalk check.
- **Practical help:** "Is my medicine working?" before-and-after; meal suggestions from the food actually on board, with supply warnings.
- **Covers all of NASA's 5 hazards and 17 risks,** each linked to where it's tracked.
- **Built for missions:** works offline, installs on a phone, animated mission home and launch, XP and streaks to keep long missions engaging; no paid AI needed.

Visual: the My body map (with its AI label) and the Space checks card.

---

## Slide 7: Basic details and what's next
**Built with:** TypeScript · Next.js · React · Tailwind CSS · Supabase (private database and storage) · Vercel · on-device text reading (tesseract.js)
**Data:** NASA-STD-3001 Vol. 1 and 2, 5 NASA HRP evidence reports, NASA's 17 risks, CSA radiation monitoring, MMASH baseline recordings, peer-reviewed spaceflight research.
**AI use:** code and text written with an AI coding assistant and reviewed and tested by the team; two illustrations generated with ChatGPT and labelled.

**Next:** direct sync with wearables and medical devices · a crew medical officer view · validation with flight surgeons and analog missions (Antarctic stations, HERA, CHAPEA) · the same self-checks for people on Earth far from care.

**Try it:** astro-med-two.vercel.app → *Try the demo*

Visual: a phone showing the mission home, with the live link large.
