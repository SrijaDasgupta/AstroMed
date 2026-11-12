/**
 * Photo analysis with the user's OWN AI (bring your own key).
 *
 * Runs in the browser: the key lives only on the user's device, and the photo goes straight from the
 * device to the AI provider the user chose (Claude, ChatGPT, Gemini, Grok or another), billed to the user's own account. AstroMed's servers never see the key.
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

export type AiProvider = "anthropic" | "openai" | "gemini" | "xai" | "custom";

/** Providers people can connect. Model names change often, so non-Claude models are a free-text field with a suggestion. */
export const AI_PROVIDERS: { id: AiProvider; name: string; keyHelp: string; keyPlaceholder: string; defaultModel: string; models: readonly string[]; modelsUrl?: string; baseUrl?: string }[] = [
  { id: "anthropic", name: "Claude (Anthropic)", keyHelp: "Create one at console.anthropic.com → API keys.", keyPlaceholder: "sk-ant-…", defaultModel: "claude-opus-5-5", models: AI_MODELS.map((m) => m.id) },
  { id: "openai", name: "ChatGPT (OpenAI)", keyHelp: "Create one at platform.openai.com → API keys.", keyPlaceholder: "sk-…", defaultModel: "gpt-5", models: ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o"], modelsUrl: "https://platform.openai.com/docs/models", baseUrl: "https://api.openai.com/v1" },
  { id: "gemini", name: "Gemini (Google)", keyHelp: "Create one at aistudio.google.com → Get API key.", keyPlaceholder: "AIza…", defaultModel: "gemini-2.5-flash", models: ["gemini-2.5-flash", "gemini-2.5-pro"], modelsUrl: "https://ai.google.dev/gemini-api/docs/models" },
  { id: "xai", name: "Grok (xAI)", keyHelp: "Create one at console.x.ai → API keys.", keyPlaceholder: "xai-…", defaultModel: "grok-4", models: ["grok-4"], modelsUrl: "https://docs.x.ai/docs/models", baseUrl: "https://api.x.ai/v1" },
  { id: "custom", name: "Other", keyHelp: "Any service with an OpenAI-compatible chat API that accepts images (for example OpenRouter, Mistral, or a model on your own computer).", keyPlaceholder: "Your key", defaultModel: "", models: [] },
];
export const providerInfo = (id: AiProvider) => AI_PROVIDERS.find((p) => p.id === id)!;

export type AiSettings = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  /** "Other" only: the service's OpenAI-compatible base URL, such as https://openrouter.ai/api/v1. */
  baseUrl?: string;
  /** "Other" only: a name to show, such as "OpenRouter". */
  label?: string;
};

/** Display name for a connection, such as "ChatGPT (OpenAI)" or the user's own label. */
export const providerName = (s: AiSettings) => (s.provider === "custom" ? s.label?.trim() || "Other AI" : providerInfo(s.provider).name);

/** Accepts https URLs, and http only for this computer (a local model). */
export function validBaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch {
    return false;
  }
}

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
    if (!v || typeof v.apiKey !== "string" || !v.apiKey || typeof v.model !== "string" || !v.model) return null;
    if (!AI_PROVIDERS.some((p) => p.id === v.provider)) return null;
    if (v.provider === "custom" && !(typeof v.baseUrl === "string" && validBaseUrl(v.baseUrl))) return null;
    return v as AiSettings;
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

async function anthropicClient(settings: AiSettings) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  // The key is the user's own and stays on their device; requests go directly to Anthropic.
  return new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
}

export class AiError extends Error {}

async function explainAnthropic(error: unknown): Promise<AiError> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  if (error instanceof Anthropic.AuthenticationError) return new AiError("Your API key wasn't accepted. Check it on the AI connection page.");
  if (error instanceof Anthropic.PermissionDeniedError) return new AiError("Your API key doesn't have access to this model.");
  if (error instanceof Anthropic.RateLimitError) return new AiError("Your AI account is rate-limited or out of credit. Try again later.");
  if (error instanceof Anthropic.BadRequestError) return new AiError(`The AI request was rejected: ${error.message}`);
  if (error instanceof Anthropic.APIError) return new AiError(`AI service error (${error.status ?? "network"}). Try again.`);
  return new AiError(error instanceof Error ? error.message : "Something went wrong.");
}

/** Friendly message for an HTTP error from any other provider. */
async function explainHttp(res: Response): Promise<AiError> {
  let detail = "";
  try {
    const body = await res.json();
    detail = String(body?.error?.message ?? (typeof body?.error === "string" ? body.error : body?.message) ?? "").slice(0, 200);
  } catch { /* not JSON */ }
  // Gemini and Grok answer a bad key with 400, so look at the message too.
  if (res.status === 401 || res.status === 403 || /api[ _-]?key/i.test(detail)) return new AiError("Your API key wasn't accepted, or doesn't have access to this model. Check it on the AI connection page.");
  if (res.status === 404) return new AiError(`The model wasn't found. Check the model name on the AI connection page.${detail ? ` (${detail})` : ""}`);
  if (res.status === 429) return new AiError("Your AI account is rate-limited or out of credit. Try again later.");
  if (res.status === 400) return new AiError(`The AI request was rejected${detail ? `: ${detail}` : "."}`);
  return new AiError(`AI service error (${res.status}). Try again.`);
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  } catch {
    throw new AiError("Couldn't reach the AI service. Check your connection, and for \"Other\" check the base URL and that the service allows requests from a browser.");
  }
  if (!res.ok) throw await explainHttp(res);
  return res.json();
}

const openAiBase = (s: AiSettings) => (s.provider === "custom" ? s.baseUrl! : providerInfo(s.provider).baseUrl!).replace(/\/+$/, "");

type Part = { kind: "text"; text: string } | { kind: "image"; data: string };

/** Sends text and images to an OpenAI-compatible chat API (ChatGPT, Grok, Other) and returns the reply text. */
async function openAiChat(s: AiSettings, parts: Part[], json: boolean): Promise<string> {
  const content = parts.map((p) => (p.kind === "text" ? { type: "text", text: p.text } : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${p.data}` } }));
  const data = (await post(`${openAiBase(s)}/chat/completions`, { authorization: `Bearer ${s.apiKey}` }, {
    model: s.model,
    messages: [...(json ? [{ role: "system", content: SYSTEM }] : []), { role: "user", content }],
    ...(json ? { response_format: { type: "json_object" } } : {}),
  })) as { choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[] };
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new AiError("The AI declined to analyze this photo. Describe it in an update instead, or ask your flight surgeon.");
  if (choice?.finish_reason === "length") throw new AiError("The AI's answer was incomplete. Try again.");
  return choice?.message?.content ?? "";
}

/** Sends text and images to Gemini and returns the reply text. */
async function geminiChat(s: AiSettings, parts: Part[], json: boolean): Promise<string> {
  const data = (await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.model)}:generateContent`, { "x-goog-api-key": s.apiKey }, {
    ...(json ? { systemInstruction: { parts: [{ text: SYSTEM }] }, generationConfig: { responseMimeType: "application/json" } } : {}),
    contents: [{ role: "user", parts: parts.map((p) => (p.kind === "text" ? { text: p.text } : { inlineData: { mimeType: "image/jpeg", data: p.data } })) }],
  })) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  const c = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || c?.finishReason === "SAFETY") throw new AiError("The AI declined to analyze this photo. Describe it in an update instead, or ask your flight surgeon.");
  if (c?.finishReason === "MAX_TOKENS") throw new AiError("The AI's answer was incomplete. Try again.");
  return c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

const JSON_INSTRUCTIONS = `Reply with only a JSON object matching this JSON Schema, with no other text:\n${JSON.stringify(z.toJSONSchema(PhotoAnalysisSchema))}`;

/** Parses and checks a JSON reply from a provider without structured outputs. */
export function parseReply(text: string): PhotoAnalysis {
  const match = text.match(/\{[\s\S]*\}/);
  let raw: unknown;
  try {
    raw = JSON.parse(match ? match[0] : text);
  } catch {
    throw new AiError("The AI's answer wasn't in the expected format. Try again, or pick a different model.");
  }
  const parsed = PhotoAnalysisSchema.safeParse(raw);
  if (!parsed.success) throw new AiError("The AI's answer was missing some details. Try again, or pick a different model.");
  return parsed.data;
}

/** Quick check that the key and model work. */
export async function testConnection(settings: AiSettings): Promise<void> {
  if (settings.provider === "anthropic") {
    try {
      const c = await anthropicClient(settings);
      await c.messages.create({ model: settings.model, max_tokens: 2000, output_config: { effort: "low" }, messages: [{ role: "user", content: "Reply with OK." }] });
    } catch (e) {
      throw await explainAnthropic(e);
    }
    return;
  }
  const parts: Part[] = [{ kind: "text", text: "Reply with OK." }];
  if (settings.provider === "gemini") await geminiChat(settings, parts, false);
  else await openAiChat(settings, parts, false);
}

/** Analyzes a photo (and an optional earlier photo for comparison) with the user's own AI. */
export async function analyzePhoto(settings: AiSettings, input: { photo: Blob; earlier?: Blob; context: string }): Promise<StoredAnalysis> {
  const [now, before] = await Promise.all([toJpegBase64(input.photo), input.earlier ? toJpegBase64(input.earlier) : Promise.resolve(undefined)]);
  const parts: Part[] = [];
  if (before) parts.push({ kind: "text", text: "Earlier photo of the same problem:" }, { kind: "image", data: before });
  parts.push({ kind: "text", text: before ? "Latest photo:" : "Photo:" }, { kind: "image", data: now });
  parts.push({ kind: "text", text: `What the astronaut wrote about it:\n${input.context || "(nothing written)"}` });
  const stamp = (a: PhotoAnalysis, model: string): StoredAnalysis => ({ ...a, model: model.slice(0, 60), analyzedAt: new Date().toISOString() });

  if (settings.provider !== "anthropic") {
    const withFormat = [...parts, { kind: "text" as const, text: JSON_INSTRUCTIONS }];
    const text = settings.provider === "gemini" ? await geminiChat(settings, withFormat, true) : await openAiChat(settings, withFormat, true);
    return stamp(parseReply(text), settings.model);
  }

  try {
    const { betaZodOutputFormat } = await import("@anthropic-ai/sdk/helpers/beta/zod");
    const c = await anthropicClient(settings);
    const content = parts.map((p) => (p.kind === "text"
      ? { type: "text" as const, text: p.text }
      : { type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data: p.data } }));
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
    return stamp(response.parsed_output, response.model);
  } catch (e) {
    throw e instanceof AiError ? e : await explainAnthropic(e);
  }
}
