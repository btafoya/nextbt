# 08 — WYSIWYG + Inline AI (OpenRouter)

We use **TipTap** for the editor and add an inline AI sidecar.

## UI
- Right‑side drawer with “Ask AI about this issue…”
- Insert AI replies as quoted text or as a draft note.

## OpenRouter Client
`/lib/ai/openrouter.ts`
```ts
export async function chatOpenRouter(messages: { role: "system"|"user"|"assistant", content: string }[], opts?: { model?: string }) {
  const { openrouterApiKey, openrouterBaseUrl, openrouterModel } = (await import("@/config/secrets")).secrets;
  const res = await fetch(`${openrouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openrouterApiKey}`
    },
    body: JSON.stringify({
      model: opts?.model ?? openrouterModel,
      messages,
      stream: false
    })
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}
```

## TipTap Component (sketch)
- Provide `/components/wysiwyg/Editor.tsx` (TipTap init)
- Provide `/components/wysiwyg/InlineAI.tsx` (prompt textarea + “Insert to editor” button)
