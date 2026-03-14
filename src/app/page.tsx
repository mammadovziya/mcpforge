"use client";

import { Header } from "@/components/Header";
import { RepoInput } from "@/components/RepoInput";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { ResultsPanel } from "@/components/ResultsPanel";
import { useGenerate } from "@/hooks/useGenerate";

export default function Home() {
  const { state, steps, result, error, generate, reset } = useGenerate();

  const handleSubmit = (url: string) => {
    generate(url);
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pb-16">
        <RepoInput onSubmit={handleSubmit} isLoading={state === "loading"} />

        {state === "loading" && <ProgressSteps steps={steps} />}

        {state === "error" && (
          <ErrorDisplay message={error} onRetry={handleRetry} />
        )}

        {state === "success" && result && <ResultsPanel result={result} />}
      </main>

      <footer className="text-center py-6 text-xs text-zinc-600 border-t border-border">
        MCPForge — Powered by OpenAI gpt-4o and the Model Context Protocol
      </footer>
    </div>
  );
}
