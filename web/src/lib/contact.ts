/**
 * Who to contact, and how, depends on how far the crew is from Earth.
 * Near Earth the flight surgeon on the ground answers within seconds. On a Mars mission a message takes
 * 4–24 minutes each way, so the crew (led by the crew medical officer) has to act first and report after:
 * "With communication delays, crews must spot and handle problems themselves" (Behavioral evidence report, p. 55).
 */
import type { Cite } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import type { MissionEnvironment } from "@/lib/environments";

export type Reach = "earth" | "near" | "moon" | "far";
export const DELAY_CITE: Cite = { source: "behavioral", page: 55 };

export function reachOf(env?: Pick<MissionEnvironment, "id">): Reach {
  switch (env?.id) {
    case "mars-transit":
    case "mars-surface":
      return "far";
    case "lunar-surface":
      return "moon";
    case "leo":
      return "near";
    default:
      return "earth";
  }
}

export type ContactText = { title: string; body: string };

export function contactText(level: Escalation, env?: Pick<MissionEnvironment, "id" | "commDelay">): ContactText {
  const reach = reachOf(env);
  const delay = env && "commDelay" in env ? env.commDelay : "";
  if (reach === "far") {
    return {
      now: { title: "Start emergency care with your crew medical officer now", body: `Follow your mission's emergency medical procedure, then alert the flight surgeon. Messages take ${delay} each way, so don't wait for a reply before acting.` },
      today: { title: "Tell your crew medical officer, and report to the flight surgeon today", body: `A reply can take twice the ${delay} signal delay. Send your readings, photos and what you've tried in one message so they can answer in one go.` },
      routine: { title: "Include it in your next medical report to the ground", body: "Not urgent. Keep tracking it so the flight surgeon sees the trend." },
      none: { title: "No action needed", body: "Everything is within the expected range. Keep up the routine." },
    }[level];
  }
  if (reach === "moon") {
    return {
      now: { title: "Contact the flight surgeon now, and start care with your crew", body: "The ground answers within seconds, but getting back to Earth takes days, so begin your emergency medical procedure while you call." },
      today: { title: "Contact the flight surgeon today", body: "Send a message or request a call within the day." },
      routine: { title: "Raise it at your next private medical conference", body: "Not urgent, but worth discussing. Keep tracking it." },
      none: { title: "No action needed", body: "Everything is within the expected range. Keep up the routine." },
    }[level];
  }
  if (reach === "near") {
    return {
      now: { title: "Contact the flight surgeon now", body: "Use the emergency or next available channel. Don't wait for a scheduled conference." },
      today: { title: "Contact the flight surgeon today", body: "Send a message or request a call within the day." },
      routine: { title: "Raise it at your next private medical conference", body: "Not urgent, but worth discussing. Keep tracking it." },
      none: { title: "No action needed", body: "Everything is within the expected range. Keep up the routine." },
    }[level];
  }
  return {
    now: { title: "Contact your flight surgeon or emergency services now", body: "On Earth, call your local emergency number. Don't wait for AstroMed." },
    today: { title: "Contact your flight surgeon today", body: "Send a message or request a call within the day." },
    routine: { title: "Bring it up at your next check-in", body: "Not urgent, but worth discussing. Keep tracking it." },
    none: { title: "No action needed", body: "Everything is within the expected range. Keep up the routine." },
  }[level];
}

/** One line on how medical support works at this distance, for the mission page and summaries. */
export function supportLine(env?: Pick<MissionEnvironment, "id" | "commDelay">): string {
  switch (reachOf(env)) {
    case "far": return `Messages to Earth take ${env?.commDelay} each way and there's no quick way home, so your crew medical officer leads urgent care and the flight surgeon advises by message.`;
    case "moon": return "The flight surgeon can talk to you almost live, but returning to Earth takes days, so the crew starts urgent care on site.";
    case "near": return "The flight surgeon is a call away, and getting home is far quicker than from the Moon or Mars.";
    default: return "Your flight surgeon and local emergency services are reachable directly.";
  }
}
