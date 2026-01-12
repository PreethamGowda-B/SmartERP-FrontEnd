"use client";

import { useState } from "react";
import { askAI } from "@/services/ai";

export default function AIAssistant({
  token,
  module,
}: {
  token: string;
  module?: string;
}) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const data = await askAI({
        message: input,
        token,
        module,
      });
      setReply(data.reply);
    } catch {
      setError("AI assistant is unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask AI..."
      />

      <button onClick={handleAsk} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {reply && <p>{reply}</p>}
    </div>
  );
}
