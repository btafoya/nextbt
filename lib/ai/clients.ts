import "server-only";
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIGenerateOptions {
  model?: string;
  messages: AIMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export class AIClient {
  private static getDefaultModel(): string {
    return secrets.openrouterModel || "openai/gpt-4o-mini";
  }

  static async generate(options: AIGenerateOptions) {
    const {
      model = this.getDefaultModel(),
      messages,
      stream = true,
      temperature = 0.7,
      maxTokens = 2000,
    } = options;

    const apiKey = secrets.openrouterApiKey;
    const baseURL = secrets.openrouterBaseUrl;

    if (!apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": secrets.openrouterSiteUrl || "https://nextbt.local",
      "X-Title": secrets.openrouterSiteName || "NextBT Bug Tracker",
    };

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (stream) {
        return response;
      } else {
        const json = await response.json();
        return json.choices?.[0]?.message?.content || "";
      }
    } catch (error) {
      logger.error("AI generation error:", error);
      throw new Error(
        `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

// Helper function to convert stream Response to Server-Sent Events format
export function streamToResponse(response: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}