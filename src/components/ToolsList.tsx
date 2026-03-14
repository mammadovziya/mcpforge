"use client";

import { useState } from "react";
import { McpTool } from "@/lib/types";
import { Wrench, ChevronDown, ChevronRight } from "lucide-react";

interface ToolsListProps {
  tools: McpTool[];
}

export function ToolsList({ tools }: ToolsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!tools.length) return null;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">
          Generated MCP Tools
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          {tools.length} tool{tools.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {tools.map((tool, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() =>
                  setExpandedIndex(isExpanded ? null : i)
                }
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-medium text-violet-300">
                    {tool.name}
                  </code>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {tool.description}
                  </p>
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-4 pl-12 animate-fade-in">
                  <p className="text-sm text-zinc-400 mb-3">
                    {tool.description}
                  </p>
                  {tool.parameters &&
                    Object.keys(tool.parameters).length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                          Parameters
                        </h4>
                        <pre className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
                          <code className="text-zinc-300">
                            {JSON.stringify(tool.parameters, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
