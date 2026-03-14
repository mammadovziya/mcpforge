import OpenAI from "openai";
import { RepoContent } from "./types";

interface GeneratedTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  implementation?: string;
}

interface GeneratedMcpResponse {
  repo_summary: string;
  tools: GeneratedTool[];
  mcp_server_code: string;
  package_json: string;
  readme: string;
  setup_instructions: string;
}

const SYSTEM_PROMPT = `You are an expert MCP (Model Context Protocol) server architect and code generator.

Your job is to analyze a GitHub repository and automatically generate a fully working MCP server that exposes the repository's functionality as tools that AI agents can use.

When given a GitHub repository's content (README, file structure, key source files), you will:

1. ANALYZE the repository:
   - Understand what the tool/library does
   - Identify all callable functions, commands, or API endpoints
   - Understand input parameters, types, and expected outputs
   - Identify dependencies and requirements

2. DESIGN the MCP server:
   - Decide which functions are most useful to expose as MCP tools
   - Define clean tool names (snake_case, descriptive)
   - Define input schemas with proper types and descriptions
   - Define what each tool returns

3. GENERATE the complete MCP server code:
   - Full working Node.js MCP server using @modelcontextprotocol/sdk
   - Proper tool schemas with JSON Schema validation
   - Clean error handling for every tool
   - A README explaining how to install and use the MCP server

4. GENERATE hosted tool implementations:
   - For EACH tool, provide a self-contained JavaScript async function body in the "implementation" field
   - The implementation MUST use ONLY: fetch() for HTTP calls, JSON, Math, String, Array, Date, RegExp, URL, URLSearchParams, TextEncoder, TextDecoder, and standard JavaScript built-ins
   - The implementation MUST NOT use: require(), import(), fs, child_process, or any Node.js-specific modules
   - The implementation receives the tool parameters as local variables matching the parameter names
   - The implementation MUST return a string (the tool result text)
   - If the tool would normally need a library, implement it using the equivalent HTTP API calls via fetch()
   - Example implementation for a "search_repos" tool with parameter "query":
     "const res = await fetch(\`https://api.github.com/search/repositories?q=\${encodeURIComponent(query)}\`, { headers: { 'Accept': 'application/vnd.github.v3+json' } }); if (!res.ok) throw new Error(\`GitHub API error: \${res.status}\`); const data = await res.json(); return JSON.stringify(data.items.slice(0, 5).map(r => ({ name: r.full_name, description: r.description, stars: r.stargazers_count, url: r.html_url })), null, 2);"

Return ONLY a raw JSON object with this exact structure, no markdown, no backticks:
{
  "repo_summary": "string - a concise summary of what the repository does",
  "tools": [{ "name": "string", "description": "string", "parameters": { "type": "object", "properties": {}, "required": [] }, "implementation": "string - async function body using only fetch() and JS built-ins, receives params as local vars, must return a string" }],
  "mcp_server_code": "string - the complete index.js file content",
  "package_json": "string - the complete package.json content",
  "readme": "string - the complete README.md content",
  "setup_instructions": "string - step by step setup instructions"
}

If any section is uncertain, still include every required top-level key with a best-effort value.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function sanitizeName(name: string): string {
  const safe = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return safe || "generated-mcp-server";
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    // Try a best-effort extraction in case extra text wrapped valid JSON.
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function buildFallbackPackageJson(repoName: string): string {
  const safeName = sanitizeName(repoName);
  const packageJson = {
    name: `${safeName}-mcp-server`,
    version: "1.0.0",
    private: true,
    type: "module",
    main: "index.js",
    scripts: {
      start: "node index.js",
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.27.1",
      zod: "^4.3.6",
    },
  };

  return JSON.stringify(packageJson, null, 2);
}

function buildFallbackMcpServerCode(
  repoName: string,
  tools: GeneratedTool[]
): string {
  const safeName = sanitizeName(repoName);
  const serializedTools = JSON.stringify(tools, null, 2);

  return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const TOOLS = ${serializedTools};

function jsonSchemaToZodShape(parameters) {
  const props =
    parameters &&
    typeof parameters === "object" &&
    parameters.properties &&
    typeof parameters.properties === "object"
      ? parameters.properties
      : {};

  const required =
    Array.isArray(parameters?.required) && parameters.required.every((item) => typeof item === "string")
      ? parameters.required
      : [];

  const shape = {};

  for (const [key, schema] of Object.entries(props)) {
    const type = schema && typeof schema === "object" ? schema.type : "string";
    const description =
      schema && typeof schema === "object" && typeof schema.description === "string"
        ? schema.description
        : key;

    let field;
    switch (type) {
      case "number":
        field = z.number().describe(description);
        break;
      case "integer":
        field = z.number().int().describe(description);
        break;
      case "boolean":
        field = z.boolean().describe(description);
        break;
      case "array":
        field = z.array(z.unknown()).describe(description);
        break;
      case "object":
        field = z.record(z.string(), z.unknown()).describe(description);
        break;
      case "string":
      default:
        field = z.string().describe(description);
        break;
    }

    if (!required.includes(key)) {
      field = field.optional();
    }

    shape[key] = field;
  }

  return shape;
}

async function executeTool(implementation, args) {
  const paramNames = Object.keys(args || {});
  const paramValues = Object.values(args || {});
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction("fetch", ...paramNames, implementation);
  const result = await fn(fetch, ...paramValues);
  return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}

const server = new McpServer({
  name: "${safeName}",
  version: "1.0.0",
});

for (const tool of TOOLS) {
  const shape = jsonSchemaToZodShape(tool.parameters || {});

  server.tool(
    tool.name,
    tool.description || tool.name,
    shape,
    async (args) => {
      try {
        const implementation =
          typeof tool.implementation === "string" && tool.implementation.trim().length
            ? tool.implementation
            : 'return "Tool implementation not available";';

        const text = await executeTool(implementation, args || {});
        return {
          content: [{ type: "text", text }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool execution failed";
        return {
          content: [{ type: "text", text: \`Error: \${message}\` }],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
`;
}

function normalizeTool(tool: unknown, index: number): GeneratedTool | null {
  if (!isRecord(tool)) return null;

  const name = asString(tool.name) ?? asString(tool.tool_name) ?? `tool_${index + 1}`;
  const description = asString(tool.description) ?? `Generated tool ${index + 1}`;

  const parameters =
    (isRecord(tool.parameters) && tool.parameters) ||
    (isRecord(tool.input_schema) && tool.input_schema) ||
    (isRecord(tool.inputSchema) && tool.inputSchema) ||
    { type: "object", properties: {}, required: [] };

  const implementation =
    asString(tool.implementation) ??
    asString(tool.code) ??
    'return "Tool implementation not available";';

  return {
    name,
    description,
    parameters,
    implementation,
  };
}

function normalizeAiResponse(
  parsed: Record<string, unknown>,
  repoName: string
): GeneratedMcpResponse {
  const root = isRecord(parsed.result) ? parsed.result : parsed;

  const toolsRaw = Array.isArray(root.tools) ? root.tools : [];
  const tools: GeneratedTool[] = toolsRaw
    .map((tool, index) => normalizeTool(tool, index))
    .filter((tool): tool is GeneratedTool => Boolean(tool));

  const repo_summary =
    asString(root.repo_summary) ??
    asString(root.repoSummary) ??
    asString(root.summary) ??
    `MCP server generated for ${repoName}.`;

  const mcp_server_code =
    asString(root.mcp_server_code) ??
    asString(root.mcpServerCode) ??
    asString(root.server_code) ??
    asString(root.index_js) ??
    asString(root.indexJs) ??
    buildFallbackMcpServerCode(repoName, tools);

  const package_json =
    asString(root.package_json) ??
    asString(root.packageJson) ??
    asString(root.package) ??
    buildFallbackPackageJson(repoName);

  const readme =
    asString(root.readme) ??
    asString(root.README) ??
    `# ${repoName} MCP Server\n`;

  const setup_instructions =
    asString(root.setup_instructions) ??
    asString(root.setupInstructions) ??
    '1. Install dependencies with "npm install".\n2. Start the server with "node index.js".';

  return {
    repo_summary,
    tools,
    mcp_server_code,
    package_json,
    readme,
    setup_instructions,
  };
}

export async function generateMcpServer(repoContent: RepoContent): Promise<{
  repo_summary: string;
  tools: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    implementation?: string;
  }[];
  mcp_server_code: string;
  package_json: string;
  readme: string;
  setup_instructions: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    throw new Error(
      "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local"
    );
  }

  const openai = new OpenAI({ apiKey, timeout: 120000 });

  const userMessage = `Here is the repository content:

README:
${repoContent.readme}

File Tree:
${repoContent.fileTree}

package.json / requirements.txt:
${repoContent.dependencies}

Main entry file:
${repoContent.mainFile}

Generate the MCP server now. Remember: each tool in the "tools" array MUST include an "implementation" field with a self-contained async function body that uses only fetch() and JavaScript built-ins. The implementation receives tool parameters as local variables and must return a string.`;

  let lastErrorMessage = "Failed to generate MCP server. Please try again.";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryInstruction =
      attempt === 1
        ? ""
        : "\n\nIMPORTANT: Your previous reply was invalid. Return valid JSON only, and include every required top-level key exactly as requested.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage + retryInstruction },
      ],
      temperature: 0.3,
      max_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      lastErrorMessage = "OpenAI returned an empty response. Please try again.";
      continue;
    }

    const parsed = parseJsonObject(content);
    if (!parsed) {
      lastErrorMessage =
        "Failed to parse AI response. The output may have been truncated. Please try again.";
      continue;
    }

    return normalizeAiResponse(parsed, repoContent.repoName);
  }

  throw new Error(lastErrorMessage);
}
