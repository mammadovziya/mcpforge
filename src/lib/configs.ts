import { IdeConfig } from "./types";

function createLocalStdioProcessConfig(safeName: string): {
  command: string;
  args: string[];
} {
  return {
    command: "/bin/bash",
    args: [
      "-lc",
      `export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"; exec node "$HOME/mcp-servers/${safeName}/index.js"`,
    ],
  };
}

export function generateIdeConfigs(repoName: string): IdeConfig[] {
  const safeName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const localProcessConfig = createLocalStdioProcessConfig(safeName);

  return [
    {
      name: "Claude Desktop",
      filename: "claude_desktop_config.json",
      path: "~/.config/claude/claude_desktop_config.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              ...localProcessConfig,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Cursor",
      filename: "cursor_mcp.json",
      path: "~/.cursor/mcp.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              ...localProcessConfig,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "VS Code",
      filename: "vscode_mcp.json",
      path: ".vscode/mcp.json",
      config: JSON.stringify(
        {
          servers: {
            [safeName]: {
              type: "stdio",
              ...localProcessConfig,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Windsurf",
      filename: "windsurf_mcp_config.json",
      path: "~/.codeium/windsurf/mcp_config.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              ...localProcessConfig,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Antigravity",
      filename: "antigravity_mcp_config.json",
      path: "Agent Panel > MCP Servers > Raw Config",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              $typeName:
                "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
              ...localProcessConfig,
              env: {
                PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
              },
            },
          },
        },
        null,
        2
      ),
    },
  ];
}

/**
 * Generate IDE configs for a remotely-hosted MCP server (Streamable HTTP transport).
 * These configs point to the live URL instead of a local node process.
 */
export function generateRemoteIdeConfigs(
  repoName: string,
  liveUrl: string
): IdeConfig[] {
  const safeName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return [
    {
      name: "Claude Desktop",
      filename: "claude_desktop_config.json",
      path: "~/.config/claude/claude_desktop_config.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              url: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Cursor",
      filename: "cursor_mcp.json",
      path: "~/.cursor/mcp.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              url: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "VS Code",
      filename: "vscode_mcp.json",
      path: ".vscode/mcp.json",
      config: JSON.stringify(
        {
          servers: {
            [safeName]: {
              type: "sse",
              url: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Windsurf",
      filename: "windsurf_mcp_config.json",
      path: "~/.codeium/windsurf/mcp_config.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              serverUrl: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
    {
      name: "Antigravity",
      filename: "antigravity_mcp_config.json",
      path: "Agent Panel > MCP Servers > Raw Config",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              serverURL: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
  ];
}
