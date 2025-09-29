// /lib/ai/openrouter.ts
import { secrets } from "@/config/secrets";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chatOpenRouter(messages: Msg[], opts?: { model?: string }) {
  const res = await fetch(`${secrets.openrouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secrets.openrouterApiKey}`
    },
    body: JSON.stringify({
      model: opts?.model ?? secrets.openrouterModel,
      messages,
      stream: false
    }),
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}
