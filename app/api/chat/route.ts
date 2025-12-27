import { openai } from "@ai-sdk/openai"
import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"
import { NextResponse } from "next/server"
import { SYSTEM_PROMPT, buildRaceContextMessage, type EnhancedRaceContext } from "@/lib/ai-context"

export const maxDuration = 30

export async function POST(req: Request) {
  // Validate API key exists
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.",
        code: "API_KEY_MISSING",
      },
      { status: 503 }
    )
  }

  const { messages, raceContext }: { messages: UIMessage[]; raceContext: EnhancedRaceContext } = await req.json()

  const contextMessage = raceContext ? buildRaceContextMessage(raceContext) : ""

  const prompt = await convertToModelMessages([
    {
      id: "system",
      role: "system" as const,
      parts: [{ type: "text" as const, text: SYSTEM_PROMPT + contextMessage }],
    },
    ...messages,
  ])

  const result = streamText({
    model: openai("gpt-4o"),
    messages: prompt,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("Chat stream aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
