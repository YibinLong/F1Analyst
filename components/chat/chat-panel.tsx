"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { X, Send, Loader2, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Race } from "@/lib/race-data"
import type { Driver } from "@/lib/f1-teams"
import { motion, AnimatePresence } from "framer-motion"

interface Standing {
  position: number
  driver: Driver
  interval: string | null
  gapToLeader: string | null
}

interface ChatPanelProps {
  race: Race
  currentLap: number
  standings: Standing[]
  onClose: () => void
}

export function ChatPanel({ race, currentLap, standings, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    body: {
      raceContext: {
        meetingName: race.meetingName,
        country: race.country,
        circuit: race.circuitKey,
        currentLap,
        totalLaps: 57,
        standings: standings.slice(0, 10).map((s) => ({
          position: s.position,
          driver: s.driver.code,
          team: s.driver.team,
          interval: s.interval,
        })),
      },
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== "ready") return

    sendMessage({ text: input })
    setInput("")
  }

  const suggestedQuestions = [
    "Who's likely to win from here?",
    "Explain the current gaps",
    "Any strategy calls coming?",
    "How's the leader performing?",
  ]

  return (
    <div className="h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Race Analyst</h2>
            <p className="text-xs text-muted-foreground">Martin Brundle Mode</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Context badge */}
      <div className="px-4 py-2 border-b border-border/30">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Analyzing:</span>
          <span className="font-mono text-primary">{race.country}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-mono text-accent">LAP {currentLap}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto text-primary/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {"Ask me anything about this race. I'll analyze the data like a seasoned pit lane reporter."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`p-1.5 rounded-md h-fit ${message.role === "user" ? "bg-accent/10" : "bg-primary/10"}`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-accent" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${
                      message.role === "user" ? "bg-accent/10 text-foreground" : "bg-muted/50 text-foreground"
                    }`}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <p key={index} className="text-sm whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {status === "streaming" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the race..."
            disabled={status !== "ready"}
            className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || status !== "ready"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
