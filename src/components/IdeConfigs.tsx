"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import { IdeConfig } from "@/lib/types";
import { CopyButton } from "./CopyButton";

interface IdeConfigsProps {
  configs: IdeConfig[];
}

export function IdeConfigs({ configs }: IdeConfigsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!configs.length) return null;

  const active = configs[activeIndex];

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">
          IDE Installation Configs
        </h2>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex overflow-x-auto">
            {configs.map((config, i) => (
              <button
                key={config.name}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap ${
                  activeIndex === i
                    ? "text-foreground tab-active"
                    : "text-muted-foreground hover:text-zinc-300"
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>
          <div className="pr-3 flex-shrink-0">
            <CopyButton text={active.config} />
          </div>
        </div>
        {/* Config content */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Add to{" "}
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              {active.path}
            </code>
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
            <code className="text-xs text-zinc-300 leading-relaxed whitespace-pre">
              {active.config}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
