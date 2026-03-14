"use client";

import { useCallback, useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GenerateResult } from "@/lib/types";

interface DownloadButtonProps {
  result: GenerateResult;
}

export function DownloadButton({ result }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError("");

    try {
      const zip = new JSZip();

      // Root files
      zip.file("index.js", result.mcpServerCode);
      zip.file("package.json", result.packageJson);
      zip.file("README.md", result.readme);

      // IDE config files in configs/ subfolder
      const configsFolder = zip.folder("configs");
      if (configsFolder) {
        for (const config of result.ideConfigs) {
          configsFolder.file(config.filename, config.config);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const safeName = result.repoName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
      saveAs(blob, `${safeName}-mcp-server.zip`);
    } catch {
      setDownloadError("Failed to generate ZIP file. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [result]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors w-full sm:w-auto justify-center"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating ZIP...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download as ZIP
          </>
        )}
      </button>
      {downloadError && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          {downloadError}
        </p>
      )}
    </div>
  );
}
