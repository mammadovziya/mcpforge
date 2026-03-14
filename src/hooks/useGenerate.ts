"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GenerateResult, ProgressStep, SSEEvent } from "@/lib/types";

const INITIAL_STEPS: ProgressStep[] = [
  { label: "Fetching repository...", status: "pending" },
  { label: "Analysing codebase...", status: "pending" },
  { label: "Generating MCP server...", status: "pending" },
  { label: "Building IDE configs...", status: "pending" },
  { label: "Deploying live server...", status: "pending" },
];

export type GenerateState = "idle" | "loading" | "success" | "error";

function processSSEBuffer(raw: string): SSEEvent | null {
  const dataLine = raw
    .split("\n")
    .find((l) => l.startsWith("data: "));
  if (!dataLine) return null;
  const jsonStr = dataLine.slice(6);
  try {
    return JSON.parse(jsonStr) as SSEEvent;
  } catch {
    return null;
  }
}

export function useGenerate() {
  const [state, setState] = useState<GenerateState>("idle");
  const [steps, setSteps] = useState<ProgressStep[]>([...INITIAL_STEPS]);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const updateStep = useCallback(
    (label: string, status: ProgressStep["status"]) => {
      setSteps((prev) =>
        prev.map((step) => (step.label === label ? { ...step, status } : step))
      );
    },
    []
  );

  const reset = useCallback(() => {
    setState("idle");
    setSteps([...INITIAL_STEPS]);
    setResult(null);
    setError("");
  }, []);

  const generate = useCallback(
    async (repoUrl: string) => {
      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const abortController = new AbortController();
      abortRef.current = abortController;

      setState("loading");
      setSteps([...INITIAL_STEPS]);
      setResult(null);
      setError("");

      let receivedComplete = false;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Server error: ${response.statusText}`
          );
        }

        if (!response.body) {
          throw new Error("No response stream received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process all complete SSE messages in buffer
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep incomplete chunk

          for (const line of lines) {
            const event = processSSEBuffer(line);
            if (!event) continue;

            if (event.type === "progress" && event.step && event.status) {
              updateStep(
                event.step,
                event.status as ProgressStep["status"]
              );
            } else if (event.type === "complete" && event.data) {
              setResult(event.data);
              setState("success");
              receivedComplete = true;
            } else if (event.type === "error") {
              throw new Error(
                event.error || "An unexpected error occurred"
              );
            }
          }
        }

        // Process any remaining data in buffer after stream ends
        if (buffer.trim()) {
          const event = processSSEBuffer(buffer);
          if (event) {
            if (event.type === "complete" && event.data) {
              setResult(event.data);
              setState("success");
              receivedComplete = true;
            } else if (event.type === "error") {
              throw new Error(
                event.error || "An unexpected error occurred"
              );
            }
          }
        }

        // If stream ended without a complete or error event, treat as error
        if (!receivedComplete) {
          throw new Error(
            "Connection lost before generation completed. Please try again."
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Request was intentionally cancelled
        }
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(message);
        setState("error");
      }
    },
    [updateStep]
  );

  return { state, steps, result, error, generate, reset };
}
