import { IdeConfig } from "./types";

export function generateIdeConfigs(repoName: string): IdeConfig[] {
  const safeName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const home = process.env.HOME || process.env.USERPROFILE || "/home/user";
  const serverPath = `${home}/mcp-servers/${safeName}/index.js`;

  return [
    {
      name: "Claude Desktop",
      filename: "claude_desktop_config.json",
      path: "~/.config/claude/claude_desktop_config.json",
      config: JSON.stringify(
        {
          mcpServers: {
            [safeName]: {
              command: "node",
              args: [serverPath],
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
              command: "node",
              args: [serverPath],
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
              command: "node",
              args: [serverPath],
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
              command: "node",
              args: [serverPath],
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
              command: "node",
              args: [serverPath],
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
              url: liveUrl,
            },
          },
        },
        null,
        2
      ),
    },
  ];
}
