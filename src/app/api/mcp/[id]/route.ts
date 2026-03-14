import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getMcpServer, StoredTool } from "@/lib/supabase";
import { z } from "zod";

export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a JSON Schema "properties" object into a Zod shape so we can pass
 * it to `server.tool()`.  We only handle the primitive types that the AI is
 * likely to produce; anything else falls back to `z.string()`.
 */
function jsonSchemaToZodShape(
  parameters: Record<string, unknown>
): Record<string, z.ZodTypeAny> {
  const props =
    (parameters?.properties as Record<
      string,
      { type?: string; description?: string }
    >) ?? {};
  const required: string[] = (parameters?.required as string[]) ?? [];

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, schema] of Object.entries(props)) {
    let field: z.ZodTypeAny;
    switch (schema?.type) {
      case "number":
      case "integer":
        field = z.number().describe(schema.description ?? key);
        break;
      case "boolean":
        field = z.boolean().describe(schema.description ?? key);
        break;
      case "array":
        field = z.array(z.unknown()).describe(schema.description ?? key);
        break;
      case "object":
        field = z.record(z.string(), z.unknown()).describe(schema.description ?? key);
        break;
      case "string":
      default:
        field = z.string().describe(schema.description ?? key);
        break;
    }

    if (!required.includes(key)) {
      field = field.optional();
    }
    shape[key] = field;
  }

  return shape;
}

/**
 * Execute a tool implementation string inside a sandboxed async function.
 * The function body receives tool parameters as local variables and `fetch`
 * as the HTTP primitive.
 */
async function executeTool(
  implementation: string,
  args: Record<string, unknown>
): Promise<string> {
  const paramNames = Object.keys(args);
  const paramValues = Object.values(args);

  // Build an AsyncFunction (the async equivalent of `new Function`)
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const AsyncFunction = Object.getPrototypeOf(
    async function () {}
  ).constructor as new (...args: string[]) => (
    ...values: unknown[]
  ) => Promise<unknown>;

  const fn = new AsyncFunction("fetch", ...paramNames, implementation);

  const result = await fn(fetch, ...paramValues);
  return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}

// ---------------------------------------------------------------------------
// Build a fresh McpServer for a given DB record's tools
// ---------------------------------------------------------------------------

function buildMcpServer(
  serverName: string,
  tools: StoredTool[]
): McpServer {
  const mcp = new McpServer({
    name: serverName,
    version: "1.0.0",
  });

  for (const tool of tools) {
    const shape = jsonSchemaToZodShape(tool.parameters);

    mcp.tool(
      tool.name,
      tool.description,
      shape,
      async (args: Record<string, unknown>) => {
        try {
          const text = await executeTool(tool.implementation, args);
          return { content: [{ type: "text" as const, text }] };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Tool execution failed";
          return {
            content: [{ type: "text" as const, text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }

  return mcp;
}

// ---------------------------------------------------------------------------
// Route handler -- supports GET, POST, DELETE as required by Streamable HTTP
// ---------------------------------------------------------------------------

async function handleMcpRequest(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  // Fetch the server definition from Supabase
  let record;
  try {
    record = await getMcpServer(id);
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!record) {
    return new Response(
      JSON.stringify({ error: "MCP server not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Build a fresh MCP server + transport for each request
  const mcp = buildMcpServer(record.repo_name, record.tools);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true,
  });

  await mcp.connect(transport);

  // Let the transport handle the actual request (GET/POST/DELETE)
  const response = await transport.handleRequest(request);

  return response;
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
