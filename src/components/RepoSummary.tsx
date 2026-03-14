"use client";

import { BookOpen } from "lucide-react";

interface RepoSummaryProps {
  summary: string;
  repoName: string;
}

export function RepoSummary({ summary, repoName }: RepoSummaryProps) {
  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">
          Repository Summary
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          {repoName}
        </span>
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
