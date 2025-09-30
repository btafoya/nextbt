export interface PromptContext {
  docType: "issue" | "task" | "note";
  docId?: string;
  fieldKey?: string;
  locale?: string;
  tone?: "formal" | "neutral" | "friendly";
  highlightedText?: string;
  projectName?: string;
  issueCategory?: string;
}

export class PromptBuilder {
  static getSystemPrompt(context: PromptContext): string {
    const basePrompt = `You are a professional technical writing assistant specializing in bug tracking and issue management.
You help draft and refine ${context.docType === "note" ? "bug notes and comments" : context.docType === "task" ? "task descriptions" : "issue reports"} with clarity and precision.

Key principles:
- Be precise and bias toward clarity and brevity
- Use short paragraphs and numbered lists where appropriate
- Include placeholders like [DATE], [USER], [VERSION] where details are unknown
- Explain assumptions and highlight potential issues in plain language
- Never fabricate technical facts - ask for clarification when information is missing

Important guardrails:
- Focus on clear, actionable technical communication
- Always remind users that outputs are suggestions requiring review
- Maintain ${context.tone || "neutral"} tone throughout

${context.projectName ? `Project: ${context.projectName}` : ""}
${context.issueCategory ? `Category: ${context.issueCategory}` : ""}`;

    if (context.fieldKey) {
      const fieldPrompts: Record<string, string> = {
        description:
          "Provide a clear, comprehensive overview of the issue or task.",
        steps_to_reproduce:
          "List specific, numbered steps to reproduce the issue.",
        additional_information:
          "Include relevant technical details like environment, version, logs.",
        summary: "Create a concise one-line summary of the issue.",
        note: "Draft a clear, professional comment or note about the issue.",
        expected_result: "Describe what should happen when the issue is fixed.",
        actual_result: "Describe the current incorrect behavior.",
      };

      const fieldGuidance = fieldPrompts[context.fieldKey];
      if (fieldGuidance) {
        return `${basePrompt}\n\nCurrent field: ${context.fieldKey}\nGuidance: ${fieldGuidance}`;
      }
    }

    return basePrompt;
  }

  static getQuickActionPrompt(
    action: string,
    text: string,
    context: PromptContext
  ): string {
    const actions: Record<string, string> = {
      tighten: `Make this text more concise while preserving all key information:\n\n${text}`,

      friendlier: `Rewrite this text in a friendlier, more approachable tone while maintaining professionalism:\n\n${text}`,

      formal: `Rewrite this text in formal technical language appropriate for a ${context.docType}:\n\n${text}`,

      plainEnglish: `Rewrite this text in plain English, avoiding jargon and complex terms:\n\n${text}`,

      summarize: `Provide a concise summary of the key points in this text:\n\n${text}`,

      bulletize: `Convert this text into a clear bulleted list:\n\n${text}`,

      expand: `Expand this text with more detail and clarification:\n\n${text}`,

      risks: `Identify potential issues or concerns in this text and suggest improvements:\n\n${text}`,

      complete: `Complete this partial text with appropriate content for a ${context.docType}:\n\n${text}`,

      translate: `Translate this text to ${context.locale || "Spanish"} while maintaining professional tone:\n\n${text}`,
    };

    return actions[action] || `Help improve this text:\n\n${text}`;
  }

  static getFieldSuggestionPrompt(
    fieldKey: string,
    context: PromptContext
  ): string {
    const suggestions: Record<string, string> = {
      description: `Generate a comprehensive issue description for a ${context.projectName || "bug tracker"}. Include:
1. Clear problem statement
2. What is affected
3. When the issue occurs
4. Impact on users or system
5. Any error messages or symptoms`,

      steps_to_reproduce: `Create detailed steps to reproduce this issue including:
1. Initial state or preconditions
2. Numbered step-by-step actions
3. Expected result after each step
4. Actual (incorrect) result observed
5. Any necessary test data or environment details`,

      additional_information: `Suggest what additional technical information should be included:
1. Environment details (OS, browser, version)
2. Relevant log entries or error messages
3. Screenshots or screen recordings
4. Related issues or documentation
5. System configuration details`,

      summary: `Create a concise one-line summary that includes:
1. The component or feature affected
2. The core problem or behavior
3. Brief impact statement`,

      note: `Draft a professional bug note or comment including:
1. Update on current status
2. Findings or observations
3. Next steps or recommendations
4. Any blockers or dependencies`,

      expected_result: `Describe the expected correct behavior:
1. What should happen when working correctly
2. Desired user experience
3. Acceptance criteria`,

      actual_result: `Describe the actual incorrect behavior:
1. What currently happens
2. How it differs from expected
3. Frequency and consistency of the issue`,
    };

    return (
      suggestions[fieldKey] ||
      `Suggest appropriate content for the ${fieldKey} field in this ${context.docType}.`
    );
  }

  static getSafetyDisclaimer(): string {
    return "\n\n---\n*AI-generated content - Review carefully before use. Verify all technical details.*";
  }
}