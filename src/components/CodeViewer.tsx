"use client";

import { useState } from "react";
import { FileCode } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface CodeViewerProps {
  mcpServerCode: string;
  packageJson: string;
  readme: string;
}

const TABS = [
  { id: "index.js", label: "index.js" },
  { id: "package.json", label: "package.json" },
  { id: "README.md", label: "README.md" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CodeViewer({
  mcpServerCode,
  packageJson,
  readme,
}: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("index.js");

  const getContent = (tab: TabId): string => {
    switch (tab) {
      case "index.js":
        return mcpServerCode;
      case "package.json":
        return packageJson;
      case "README.md":
        return readme;
    }
  };

  const content = getContent(activeTab);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">
          Generated Code
        </h2>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-foreground tab-active"
                    : "text-muted-foreground hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="pr-3">
            <CopyButton text={content} />
          </div>
        </div>
        {/* Code content */}
        <div className="max-h-[500px] overflow-auto">
          <pre className="p-4">
            <code className="text-xs text-zinc-300 leading-relaxed whitespace-pre">
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
