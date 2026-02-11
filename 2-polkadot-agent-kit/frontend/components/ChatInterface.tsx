"use client";

import { useState, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `👋 Hello! I'm your **Polkadot Agent**.

I can help you with:

**Nomination Pool Staking:**
- Join pools, bond tokens, unbond, withdraw
- Claim staking rewards
- Check pool information

**XCM Cross-Chain Swaps:**
- Swap tokens on Hydration (DOT, USDT, USDC, DAI, HDX)
- Multi-chain token exchanges

**Supported Chains:**
Polkadot • Kusama • Westend • Hydration

What would you like to do?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message?.content || "Sorry, I encountered an error.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => {
        // Bold text
        line = line.replace(
          /\*\*(.*?)\*\*/g,
          "<strong class='text-pink-400'>$1</strong>",
        );
        // Inline code
        line = line.replace(
          /`([^`]+)`/g,
          '<code class="bg-gray-700/70 px-2 py-0.5 rounded text-sm text-green-400 font-mono">$1</code>',
        );
        // Headers
        if (line.startsWith("# ")) {
          return `<h1 class="text-xl font-bold mt-2 text-white">${line.slice(
            2,
          )}</h1>`;
        }
        if (line.startsWith("## ")) {
          return `<h2 class="text-lg font-semibold mt-2 text-white">${line.slice(
            3,
          )}</h2>`;
        }
        // List items with better styling
        if (line.startsWith("- ")) {
          return `<div class="ml-4 flex items-start gap-2"><span class="text-pink-400 mt-0.5">•</span><span>${line.slice(
            2,
          )}</span></div>`;
        }
        if (line.match(/^\d+\. /)) {
          return `<div class="ml-4">${line}</div>`;
        }
        return line || "<br/>";
      })
      .join("\n");
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Polkadot Staking Agent</h3>
          <p className="text-xs text-gray-400">Nomination Pool Operations</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" ? "bg-blue-600" : "bg-pink-600"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: formatContent(message.content),
                }}
              />
              <span className="text-xs opacity-50 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about staking... (e.g., 'Join pool #1 with 10 DOT')"
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {["Join pool #1", "Get pool info", "Claim rewards", "Help"].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
