"use client";

import { GenerateResult } from "@/lib/types";
import { RepoSummary } from "./RepoSummary";
import { ToolsList } from "./ToolsList";
import { CodeViewer } from "./CodeViewer";
import { IdeConfigs } from "./IdeConfigs";
import { DownloadButton } from "./DownloadButton";
import { LiveServerPanel } from "./LiveServerPanel";

interface ResultsPanelProps {
  result: GenerateResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {(result.liveUrl || result.installCommand) && (
        <LiveServerPanel
          liveUrl={result.liveUrl}
          repoName={result.repoName}
          installScriptUrl={result.installScriptUrl}
          installCommand={result.installCommand}
        />
      )}
      <RepoSummary summary={result.repoSummary} repoName={result.repoName} />
      <ToolsList tools={result.tools} />
      <CodeViewer
        mcpServerCode={result.mcpServerCode}
        packageJson={result.packageJson}
        readme={result.readme}
      />
      <IdeConfigs configs={result.ideConfigs} />
      <div className="flex justify-center pt-2">
        <DownloadButton result={result} />
      </div>
    </div>
  );
}
