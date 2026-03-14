"use client";

import { ProgressStep } from "@/lib/types";
import { Check, Loader2, Circle } from "lucide-react";

interface ProgressStepsProps {
  steps: ProgressStep[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 animate-fade-in">
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm transition-all duration-300 ${
              step.status === "active"
                ? "text-foreground"
                : step.status === "done"
                ? "text-green-400"
                : step.status === "error"
                ? "text-red-400"
                : "text-zinc-600"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {step.status === "active" ? (
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              ) : step.status === "done" ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : step.status === "error" ? (
                <Circle className="w-4 h-4 text-red-400" />
              ) : (
                <Circle className="w-3 h-3 text-zinc-600" />
              )}
            </div>
            <span
              className={
                step.status === "active" ? "font-medium" : ""
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
