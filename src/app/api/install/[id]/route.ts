import { generateIdeConfigs } from "@/lib/configs";
import { getMcpServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;

function toBase64(input: string): string {
  return Buffer.from(input, "utf8").toString("base64");
}

function buildInstallScript(args: {
  safeName: string;
  encodedFilesJson: string;
}): string {
  const { safeName, encodedFilesJson } = args;

  return `#!/usr/bin/env bash
set -euo pipefail

NAME="${safeName}"
DEST="$HOME/mcp-servers/$NAME"

mkdir -p "$DEST"

node - "$DEST" <<'NODE'
const fs = require("fs");
const path = require("path");

const dest = process.argv[2];
const files = ${encodedFilesJson};

for (const [relativePath, encoded] of Object.entries(files)) {
  const targetPath = path.join(dest, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, Buffer.from(encoded, "base64").toString("utf8"));
}
NODE

npm --prefix "$DEST" install --omit=dev

cat <<EOF
Installed MCP server: $NAME
Install location: $DEST

Run locally:
  node "$DEST/index.js"

IDE config snippets:
  $DEST/configs
EOF
`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  let record;
  try {
    record = await getMcpServer(id);
  } catch {
    return new Response("Failed to load MCP server", { status: 500 });
  }

  if (!record) {
    return new Response("MCP server not found", { status: 404 });
  }

  const safeName = record.repo_name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const ideConfigs = generateIdeConfigs(record.repo_name);

  const files: Record<string, string> = {
    "index.js": record.mcp_server_code,
    "package.json": record.package_json,
    "README.md": record.readme || `# ${record.repo_name} MCP Server\n`,
  };

  for (const config of ideConfigs) {
    files[`configs/${config.filename}`] = config.config;
  }

  const encodedFiles = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [path, toBase64(content)])
  );

  const script = buildInstallScript({
    safeName,
    encodedFilesJson: JSON.stringify(encodedFiles),
  });

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
