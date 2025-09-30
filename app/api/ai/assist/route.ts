import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { AIClient, streamToResponse } from "@/lib/ai/clients";
import { PromptBuilder } from "@/lib/ai/prompts";
import { AIRateLimiter } from "@/lib/ai/rate-limiter";
import { secrets } from "@/config/secrets";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireSession();

    // Check if AI Writer is enabled
    if (!secrets.aiWriterEnabled) {
      return NextResponse.json(
        { error: "AI Writer is disabled" },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimit = await AIRateLimiter.check(session.uid.toString());
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: rateLimit.resetAt,
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messages, context, stream = true } = body;

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Build system prompt based on context
    const systemPrompt = context
      ? PromptBuilder.getSystemPrompt({
          docType: context.docType || "issue",
          docId: context.docId,
          fieldKey: context.fieldKey,
          locale: context.locale,
          tone: context.tone || "neutral",
          highlightedText: context.highlightedText,
          projectName: context.projectName,
          issueCategory: context.issueCategory,
        })
      : "You are a helpful technical writing assistant for bug tracking and issue management.";

    // Prepend system message
    const fullMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    // Record the request for rate limiting
    await AIRateLimiter.record(session.uid.toString());

    // Generate AI response
    const response = await AIClient.generate({
      messages: fullMessages,
      stream,
    });

    // Handle streaming response
    if (stream && response instanceof Response) {
      return streamToResponse(response);
    }

    // Handle non-streaming response
    return NextResponse.json({
      content: response,
    });
  } catch (error) {
    console.error("AI assist error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate response",
      },
      { status: 500 }
    );
  }
}