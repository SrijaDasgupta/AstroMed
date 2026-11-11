#!/usr/bin/env python3
"""Turn each MMASH participant's 24-hour recording into a personal baseline.

Reads data/raw/mmash/user_N/*.csv and writes web/src/data/mmash_baselines.json.
Standard library only. Run from the AstroMed folder:  python3 -I scripts/build_baselines.py
"""
import csv, json, math, pathlib, statistics

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "mmash"
OUT = ROOT / "web" / "src" / "data" / "mmash_baselines.json"


def rows(path):
    if not path.exists():
        return []
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def num(v):
    try:
        x = float(v)
        return x if math.isfinite(x) else None
    except (TypeError, ValueError):
        return None


def minute_of(day, hhmm):
    """Minutes since midnight of recording day 1 (day 2 = +1440)."""
    parts = hhmm.split(":")
    return (int(day) - 1) * 1440 + int(parts[0]) * 60 + int(parts[1]) + (int(parts[2]) / 60 if len(parts) > 2 else 0)


def r1(x, nd=1):
    return None if x is None else round(x, nd)


def sleep_windows(sleep):
    wins = []
    for s in sleep:
        try:
            start = minute_of(s["Onset Date"], s["Onset Time"])
            end = minute_of(s["Out Bed Date"], s["Out Bed Time"])
        except (KeyError, ValueError):
            continue
        if end > start:
            wins.append((start, end))
    return wins


def in_windows(t, wins):
    return any(a <= t <= b for a, b in wins)


def clean_rr(rr):
    """RR intervals in seconds with times; drop impossible beats and abrupt jumps (artifacts)."""
    out, prev = [], None
    for r in rr:
        ibi = num(r.get("ibi_s"))
        if ibi is None or not (0.3 <= ibi <= 2.0):
            prev = None
            continue
        t = minute_of(r["day"], r["time"])
        if prev is not None and abs(ibi - prev) / prev > 0.2:
            prev = ibi
            continue
        out.append((t, ibi))
        prev = ibi
    return out


def rmssd_ms(series):
    diffs = [(b - a) * 1000 for (_, a), (_, b) in zip(series, series[1:])]
    return math.sqrt(sum(d * d for d in diffs) / len(diffs)) if len(diffs) > 100 else None


def build(user_dir):
    info = (rows(user_dir / "user_info.csv") or [{}])[0]
    sleep = rows(user_dir / "sleep.csv")
    wins = sleep_windows(sleep)

    acti = rows(user_dir / "Actigraph.csv")
    hr_all, hr_sleep, steps = [], [], 0.0
    for a in acti:
        hr = num(a.get("HR"))
        steps += num(a.get("Steps")) or 0
        if hr and 30 <= hr <= 200:
            hr_all.append(hr)
            if wins and in_windows(minute_of(a["day"], a["time"]), wins):
                hr_sleep.append(hr)

    rr = clean_rr(rows(user_dir / "RR.csv"))
    rr_sleep = [p for p in rr if wins and in_windows(p[0], wins)]
    hrv = rmssd_ms(rr_sleep) or rmssd_ms(rr)

    if hr_sleep:
        resting_hr, resting_src = statistics.median(hr_sleep), "median heart rate while asleep"
    elif hr_all:
        resting_hr, resting_src = sorted(hr_all)[len(hr_all) // 10], "10th percentile of 24-h heart rate (no sleep record)"
    else:
        resting_hr, resting_src = None, None

    tst = sum(num(s.get("Total Sleep Time (TST)")) or 0 for s in sleep)
    in_bed = sum(num(s.get("Total Minutes in Bed")) or 0 for s in sleep)
    waso = sum(num(s.get("Wake After Sleep Onset (WASO)")) or 0 for s in sleep)
    awakenings = sum(num(s.get("Number of Awakenings")) or 0 for s in sleep)

    saliva = {r.get("SAMPLES", "").strip(): r for r in rows(user_dir / "saliva.csv")}
    q = (rows(user_dir / "questionnaire.csv") or [{}])[0]

    def sal(sample, col):
        return num(saliva.get(sample, {}).get(col))

    times = ["10", "14", "18", "22", "9+1"]
    pos = [v for v in (num(q.get(f"panas_pos_{t}")) for t in times) if v]
    neg = [v for v in (num(q.get(f"panas_neg_{t}")) for t in times) if v]

    cort_bed, cort_wake = sal("before sleep", "Cortisol NORM"), sal("wake up", "Cortisol NORM")
    return {
        "participant": user_dir.name,
        "sex": info.get("Gender") or None,
        "age": num(info.get("Age")) or None,  # one participant is recorded as age 0
        "heightCm": num(info.get("Height")),
        "weightKg": num(info.get("Weight")),
        "restingHr": r1(resting_hr),
        "restingHrSource": resting_src,
        "meanHr24h": r1(statistics.mean(hr_all)) if hr_all else None,
        "hrvRmssdMs": r1(hrv),
        "hrvSource": "RMSSD of clean beat-to-beat intervals while asleep" if rmssd_ms(rr_sleep) else "RMSSD over whole recording",
        "steps24h": int(steps),
        "sleepHours": r1(tst / 60, 2) if sleep else None,
        "sleepEfficiencyPct": r1(100 * tst / in_bed) if in_bed else None,
        "wasoMin": r1(waso) if sleep else None,
        "awakenings": int(awakenings) if sleep else None,
        "cortisolAwakeningRatio": r1(cort_wake / cort_bed, 2) if cort_bed and cort_wake else None,
        "chronotypeMEQ": num(q.get("MEQ")),
        "traitAnxietySTAI": num(q.get("STAI2")) or None,  # STAI ranges 20-80; 0 means not recorded
        "sleepQualityPSQI": num(q.get("Pittsburgh")),
        "dailyStress": num(q.get("Daily_stress")),
        # PANAS (10-50), rated 5 times across the day: mean, and spread across the day.
        "moodPositive": r1(statistics.mean(pos)) if pos else None,
        "moodPositiveSd": r1(statistics.stdev(pos)) if len(pos) > 1 else None,
        "moodNegative": r1(statistics.mean(neg)) if neg else None,
        "moodNegativeSd": r1(statistics.stdev(neg)) if len(neg) > 1 else None,
    }


users = sorted((d for d in RAW.iterdir() if d.is_dir() and d.name.startswith("user_")), key=lambda d: int(d.name.split("_")[1]))
data = [build(d) for d in users]
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({
    "source": "MMASH (Rossi et al., Data 2020; PhysioNet doi:10.13026/cerq-fc86), ODC-BY 1.0",
    "participants": data,
}, indent=2))
print(f"wrote {len(data)} baselines to {OUT.relative_to(ROOT)}")
for d in data:
    print(d["participant"], d["sex"], d["age"], "HR", d["restingHr"], "HRV", d["hrvRmssdMs"], "sleep", d["sleepHours"], "eff", d["sleepEfficiencyPct"], "steps", d["steps24h"], "cort", d["cortisolAwakeningRatio"], "STAI", d["traitAnxietySTAI"], "mood+", d["moodPositive"], d["moodPositiveSd"], "mood-", d["moodNegative"], d["moodNegativeSd"])
