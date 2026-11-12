/**
 * Photo analysis with the user's OWN AI (bring your own key).
 *
 * Runs in the browser: the key lives only on the user's device, and the photo goes straight from the
 * device to the AI provider, billed to the user's own account. AstroMed's servers never see the key.
 * The server only stores the finished analysis, after checking it against PhotoAnalysisSchema.
 */
import { z } from "zod/v4";
import { CONDITIONS } from "@/lib/space-conditions";

export const AI_STORAGE_KEY = "astromed_ai";

export const AI_MODELS = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5 (most capable)" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5 (faster, lower cost)" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5 (fastest, lowest cost)" },
] as const;
export type AiModel = (typeof AI_MODELS)[number]["id"];

export type AiSettings = { provider: "anthropic"; apiKey: string; model: AiModel };

const CONDITION_IDS = CONDITIONS.map((c) => c.id) as [string, ...string[]];

export const PhotoAnalysisSchema = z.object({
  isHealthPhoto: z.boolean().describe("False if the photo doesn't show a body part, wound, skin, eye, nail or similar."),
  quality: z.enum(["good", "fair", "poor"]).describe("Whether the photo is sharp and well lit enough to judge."),
  description: z.string().describe("One or two plain sentences describing what is visible."),
  observations: z.array(z.string()).describe("Specific visible findings: size, colour, edges, swelling, discharge, pattern."),
  possibleConditions: z.array(z.string()).describe("Plain-language possibilities, most likely first. Not a diagnosis."),
  conditionIds: z.array(z.enum(CONDITION_IDS)).describe("IDs from the provided list that this may relate to."),
  warningSigns: z.array(z.string()).describe("Visible signs that need prompt medical attention, if any."),
  change: z.enum(["first-photo", "better", "worse", "same", "unclear"]).describe("Compared with the earlier photo, if one is given."),
  urgency: z.enum(["none", "routine", "today", "now"]).describe("none: self-care; routine: next check-in; today: contact the flight surgeon today; now: emergency."),
  urgencyReason: z.string(),
  selfCare: z.array(z.string()).describe("General, non-drug steps. Never medicines or doses."),
});
export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;
export type StoredAnalysis = PhotoAnalysis & { model: string; analyzedAt: string };

export const StoredAnalysisSchema = PhotoAnalysisSchema.extend({ model: z.string().max(60), analyzedAt: z.string().max(40) });

const SYSTEM = `You help an astronaut keep track of a health problem in AstroMed, a self-monitoring app. You look at photos they took of themselves.

Rules:
- Describe what is visible objectively. Offer possibilities in plain language, most likely first, and say they are possibilities, not a diagnosis.
- Never name or suggest medicines, creams, drugs or doses. Self-care is limited to general, non-drug steps (cleaning, covering, rest, cold pack, keeping dry, protecting the area, photographing again).
- Be conservative with urgency: if anything visible could be serious (spreading redness, red streaks, pus, deep or gaping wounds, exposed tissue, black or white skin, eye injury, large burns), choose "today" or "now".
- The person is in a spaceflight setting with a flight surgeon on call, limited supplies and possibly a delay in reaching Earth.
- If the photo is unclear or not a health photo, say so and keep urgency based only on their description.
- When an earlier photo is given, compare the two and report the change.
- Use the condition IDs only from this list: ${CONDITIONS.map((c) => `${c.id} (${c.name})`).join("; ")}.`;

export function readAiSettings(): AiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const v = JSON.parse(localStorage.getItem(AI_STORAGE_KEY) ?? "null");
    return v && v.provider === "anthropic" && typeof v.apiKey === "string" && v.apiKey ? v : null;
  } catch {
    return null;
  }
}

/** Loads an image and re-encodes it as JPEG at most `max` pixels on the long side (keeps uploads small and supported). */
export async function toJpegBase64(src: Blob, max = 1568): Promise<string> {
  const bmp = await createImageBitmap(src);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read the photo."))), "image/jpeg", 0.85));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function client(settings: AiSettings) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  // The key is the user's own and stays on their device; requests go directly to Anthropic.
  return new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
}

export class AiError extends Error {}

async function explain(error: unknown): Promise<AiError> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  if (error instanceof Anthropic.AuthenticationError) return new AiError("Your API key wasn't accepted. Check it on the AI connection page.");
  if (error instanceof Anthropic.PermissionDeniedError) return new AiError("Your API key doesn't have access to this model.");
  if (error instanceof Anthropic.RateLimitError) return new AiError("Your AI account is rate-limited or out of credit. Try again later.");
  if (error instanceof Anthropic.BadRequestError) return new AiError(`The AI request was rejected: ${error.message}`);
  if (error instanceof Anthropic.APIError) return new AiError(`AI service error (${error.status ?? "network"}). Try again.`);
  return new AiError(error instanceof Error ? error.message : "Something went wrong.");
}

/** Quick check that the key works. */
export async function testConnection(settings: AiSettings): Promise<void> {
  try {
    const c = await client(settings);
    await c.messages.create({ model: settings.model, max_tokens: 2000, output_config: { effort: "low" }, messages: [{ role: "user", content: "Reply with OK." }] });
  } catch (e) {
    throw await explain(e);
  }
}

/** Analyzes a photo (and an optional earlier photo for comparison) with the user's own Claude. */
export async function analyzePhoto(settings: AiSettings, input: { photo: Blob; earlier?: Blob; context: string }): Promise<StoredAnalysis> {
  try {
    const [now, before] = await Promise.all([toJpegBase64(input.photo), input.earlier ? toJpegBase64(input.earlier) : Promise.resolve(undefined)]);
    const { betaZodOutputFormat } = await import("@anthropic-ai/sdk/helpers/beta/zod");
    const c = await client(settings);
    const content: Array<{ type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } } | { type: "text"; text: string }> = [];
    if (before) content.push({ type: "text", text: "Earlier photo of the same problem:" }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: before } });
    content.push({ type: "text", text: before ? "Latest photo:" : "Photo:" }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: now } });
    content.push({ type: "text", text: `What the astronaut wrote about it:\n${input.context || "(nothing written)"}` });

    const response = await c.beta.messages.parse({
      model: settings.model,
      max_tokens: 16000,
      system: SYSTEM,
      ...(settings.model === "claude-haiku-5-5" ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }),
      output_config: { effort: "medium", format: betaZodOutputFormat(PhotoAnalysisSchema) },
      messages: [{ role: "user", content }],
    });
    if (response.stop_reason === "refusal") throw new AiError("The AI declined to analyze this photo. Describe it in an update instead, or ask your flight surgeon.");
    if (response.stop_reason === "max_tokens" || !response.parsed_output) throw new AiError("The AI's answer was incomplete. Try again.");
    return { ...response.parsed_output, model: response.model, analyzedAt: new Date().toISOString() };
  } catch (e) {
    throw e instanceof AiError ? e : await explain(e);
  }
}
