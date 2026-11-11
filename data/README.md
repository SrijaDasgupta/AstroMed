# Data sources

Raw files live in `data/raw/` and are not committed to git.

## MMASH: Multilevel Monitoring of Activity and Sleep in Healthy people
`data/raw/mmash/user_1 … user_22`: 22 healthy adults, about 24 h each (beat-to-beat RR intervals,
actigraphy/steps/heart rate, sleep, saliva cortisol and melatonin, questionnaires). No names in the data.
AstroMed uses each participant's real readings as a demo crew member's personal baseline;
mission days are simulated from that baseline.

Citation:
- Rossi A., Da Pozzo E., Menicagli D., Tremolanti C., Priami C., Sîrbu A., Clifton D.A., Martini C., Morelli D.
  "A Public Dataset of 24-h Multi-Levels Psycho-Physiological Responses in Young Healthy Adults." *Data* 2020, 5(4), 91.
- Dataset on PhysioNet: https://doi.org/10.13026/cerq-fc86. Open Data Commons Attribution License v1.0.

## NASA documents (`data/raw/nasa/`)
Fetched from NASA websites by `nasa_astronaut_health_download_helper`:
- NASA-STD-3001 Volume 1 Rev C and Volume 2 Rev F (crew health standards)
- Human Research Program evidence reports: bone fracture (2024), cardiovascular (2023),
  behavioral health (2025), sleep, radiation carcinogenesis (2026)
- ISS pharmaceutical care technical brief (2026)

The OSDR study catalogs (OSD-575, OSD-569, OSD-157) came back empty, so no OSDR data files are included yet.
