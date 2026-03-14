"use client";

import { Globe, Check, Copy } from "lucide-react";
import { useState, useCallback } from "react";

interface LiveServerPanelProps {
  liveUrl?: string;
  repoName: string;
  installScriptUrl?: string;
  installCommand?: string;
}

export function LiveServerPanel({
  liveUrl,
  repoName,
  installScriptUrl,
  installCommand,
}: LiveServerPanelProps) {
  const [copiedField, setCopiedField] = useState<"command" | "url" | null>(
    null
  );

  const handleCopy = useCallback(
    async (text: string, field: "command" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
    },
    []
  );

  if (!liveUrl && !installCommand) return null;

  return (
    <div className="animate-slide-up">
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <Globe className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-foreground">
            One-line Local Install
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Paste this command in terminal to install <strong>{repoName}</strong>
          into <code className="text-zinc-300">~/mcp-servers</code> with all
          dependencies.
        </p>

        {installCommand && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-xs text-violet-300 overflow-x-auto whitespace-nowrap">
              {installCommand}
            </div>
            <button
              onClick={() => handleCopy(installCommand, "command")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                copiedField === "command"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
              }`}
            >
              {copiedField === "command" ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Command
                </>
              )}
            </button>
          </div>
        )}

        {installScriptUrl && (
          <p className="text-[10px] text-muted-foreground mb-3">
            Install script URL: {installScriptUrl}
          </p>
        )}

        {liveUrl && (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Raw hosted MCP endpoint (optional):
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-xs text-violet-300 overflow-x-auto">
                {liveUrl}
              </div>
              <button
                onClick={() => handleCopy(liveUrl, "url")}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  copiedField === "url"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
                }`}
              >
                {copiedField === "url" ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy URL
                  </>
                )}
              </button>
            </div>
          </>
        )}

        <p className="text-[10px] text-muted-foreground mt-3">
          After install, copy your IDE config from the configs panel below.
        </p>
      </div>
    </div>
  );
}
