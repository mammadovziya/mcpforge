"use client";

import { Globe, Check, Copy } from "lucide-react";
import { useState, useCallback } from "react";

interface LiveServerPanelProps {
  liveUrl: string;
  repoName: string;
}

export function LiveServerPanel({ liveUrl, repoName }: LiveServerPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = liveUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [liveUrl]);

  return (
    <div className="animate-slide-up">
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <Globe className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-foreground">
            Your MCP Server is Live
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          <strong>{repoName}</strong> is now available as a remote MCP server.
          Connect any MCP-compatible client using the URL below.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-xs text-violet-300 overflow-x-auto">
            {liveUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
            }`}
          >
            {copied ? (
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
        <p className="text-[10px] text-muted-foreground mt-3">
          This server runs 24/7. Paste the URL into your IDE config or use it
          directly with any MCP client that supports Streamable HTTP transport.
        </p>
      </div>
    </div>
  );
}
