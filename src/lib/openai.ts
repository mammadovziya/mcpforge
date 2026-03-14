import OpenAI from "openai";
import { RepoContent } from "./types";

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
}`;

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response. Please try again.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      "Failed to parse AI response. The output may have been truncated. Please try again."
    );
  }

  // Validate required fields
  if (!parsed.repo_summary || !parsed.mcp_server_code || !parsed.package_json) {
    throw new Error(
      "AI generated an incomplete response. Please try again."
    );
  }

  return parsed;
}
