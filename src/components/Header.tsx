"use client";

import { Hammer } from "lucide-react";

export function Header() {
  return (
    <header className="text-center py-12 px-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-2.5 bg-violet-600/20 rounded-xl border border-violet-500/30">
          <Hammer className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-violet-400">MCP</span>
          <span className="text-foreground">Forge</span>
        </h1>
      </div>
      <p className="text-muted-foreground text-lg max-w-xl mx-auto">
        Turn any GitHub repo into a fully working MCP server.
        <br />
        <span className="text-sm text-zinc-500">
          One-click configs for Claude Desktop, VS Code, Cursor, and Windsurf.
        </span>
      </p>
    </header>
  );
}
