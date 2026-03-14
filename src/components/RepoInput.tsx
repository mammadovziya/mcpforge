"use client";

import { useState, FormEvent } from "react";
import { Github, ArrowRight, Loader2 } from "lucide-react";

interface RepoInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function RepoInput({ onSubmit, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError("Please enter a GitHub repository URL.");
      return;
    }

    const match = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/
    );
    if (!match) {
      setValidationError(
        "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
      );
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div
        className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3 transition-all duration-200 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30 ${
          validationError ? "border-red-500/50" : "border-border"
        } ${isLoading ? "animate-pulse-border" : ""}`}
      >
        <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setValidationError("");
          }}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-zinc-600 text-sm"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {validationError && (
        <p className="text-red-400 text-xs mt-2 px-1">{validationError}</p>
      )}
    </form>
  );
}
