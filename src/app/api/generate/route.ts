import { NextRequest } from "next/server";
import { parseRepoUrl, fetchRepoContent } from "@/lib/github";
import { generateMcpServer } from "@/lib/openai";
import { generateIdeConfigs } from "@/lib/configs";
import { saveMcpServer } from "@/lib/supabase";

export const maxDuration = 120;

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: { type: string; step?: string; status?: string; data?: unknown; error?: string }
) {
  const data = JSON.stringify(event);
  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
}

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  let body: { repoUrl?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { repoUrl } = body;
  if (!repoUrl || typeof repoUrl !== "string") {
    return new Response(
      JSON.stringify({ error: "repoUrl is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate URL format early
  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseRepoUrl(repoUrl));
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Invalid URL",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const baseUrl = getBaseUrl(request);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Fetch repository
        sendSSE(controller, encoder, {
          type: "progress",
          step: "Fetching repository...",
          status: "active",
        });
        const repoContent = await fetchRepoContent(owner, repo);

        sendSSE(controller, encoder, {
          type: "progress",
          step: "Fetching repository...",
          status: "done",
        });

        // Step 2: Analysing codebase
        sendSSE(controller, encoder, {
          type: "progress",
          step: "Analysing codebase...",
          status: "active",
        });

        // Small delay so the UI can display the step transition
        await new Promise((r) => setTimeout(r, 300));

        sendSSE(controller, encoder, {
          type: "progress",
          step: "Analysing codebase...",
          status: "done",
        });

        // Step 3: Generating MCP server
        sendSSE(controller, encoder, {
          type: "progress",
          step: "Generating MCP server...",
          status: "active",
        });

        const aiResult = await generateMcpServer(repoContent);

        sendSSE(controller, encoder, {
          type: "progress",
          step: "Generating MCP server...",
          status: "done",
        });

        // Step 4: Building IDE configs
        sendSSE(controller, encoder, {
          type: "progress",
          step: "Building IDE configs...",
          status: "active",
        });

        const ideConfigs = generateIdeConfigs(repoContent.repoName);

        // Step 5: Deploy live MCP server
        sendSSE(controller, encoder, {
          type: "progress",
          step: "Building IDE configs...",
          status: "done",
        });

        sendSSE(controller, encoder, {
          type: "progress",
          step: "Deploying live server...",
          status: "active",
        });

        // Save to Supabase and get live URL
        let serverId: string | undefined;
        let liveUrl: string | undefined;
        let installScriptUrl: string | undefined;
        let installCommand: string | undefined;

        try {
          const toolsWithImpl = (aiResult.tools || []).map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters || {},
            implementation:
              t.implementation || 'return "Tool implementation not available";',
          }));

          serverId = await saveMcpServer({
            repoName: repoContent.repoName,
            repoUrl,
            repoSummary: aiResult.repo_summary,
            tools: toolsWithImpl,
            mcpServerCode: aiResult.mcp_server_code,
            packageJson: aiResult.package_json,
            readme: aiResult.readme || "",
            setupInstructions: aiResult.setup_instructions || "",
          });

          liveUrl = `${baseUrl}/api/mcp/${serverId}`;
          installScriptUrl = `${baseUrl}/api/install/${serverId}`;
          installCommand = `curl -fsSL ${installScriptUrl} | bash`;
        } catch (dbErr) {
          // Don't fail the whole generation if DB save fails
          console.error("Failed to save to database:", dbErr);
        }

        sendSSE(controller, encoder, {
          type: "progress",
          step: "Deploying live server...",
          status: "done",
        });

        // Send complete result
        sendSSE(controller, encoder, {
          type: "complete",
          data: {
            repoName: repoContent.repoName,
            repoSummary: aiResult.repo_summary,
            tools: aiResult.tools || [],
            mcpServerCode: aiResult.mcp_server_code,
            packageJson: aiResult.package_json,
            readme: aiResult.readme || "",
            setupInstructions: aiResult.setup_instructions || "",
            ideConfigs,
            serverId,
            liveUrl,
            installScriptUrl,
            installCommand,
          },
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";

        sendSSE(controller, encoder, {
          type: "error",
          error: message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
