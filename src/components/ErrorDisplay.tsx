"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-red-400 font-medium text-sm mb-1">
              Generation Failed
            </h3>
            <p className="text-red-300/80 text-sm leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
