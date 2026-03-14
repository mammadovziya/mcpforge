import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// -------------------------------------------------------------------
// Database types
// -------------------------------------------------------------------

export interface McpServerRecord {
  id: string;
  repo_name: string;
  repo_url: string | null;
  repo_summary: string;
  tools: StoredTool[];
  mcp_server_code: string;
  package_json: string;
  readme: string;
  setup_instructions: string;
  created_at: string;
}

export interface StoredTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  implementation: string; // JS async function body using only fetch()
}

// -------------------------------------------------------------------
// Database helpers
// -------------------------------------------------------------------

export async function saveMcpServer(data: {
  repoName: string;
  repoUrl: string;
  repoSummary: string;
  tools: StoredTool[];
  mcpServerCode: string;
  packageJson: string;
  readme: string;
  setupInstructions: string;
}): Promise<string> {
  const { data: inserted, error } = await getSupabase()
    .from("mcp_servers")
    .insert({
      repo_name: data.repoName,
      repo_url: data.repoUrl,
      repo_summary: data.repoSummary,
      tools: data.tools,
      mcp_server_code: data.mcpServerCode,
      package_json: data.packageJson,
      readme: data.readme,
      setup_instructions: data.setupInstructions,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error("Failed to save MCP server to database");
  }

  return inserted.id;
}

export async function getMcpServer(
  id: string
): Promise<McpServerRecord | null> {
  const { data, error } = await getSupabase()
    .from("mcp_servers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Supabase fetch error:", error);
    throw new Error("Failed to fetch MCP server from database");
  }

  return data as McpServerRecord;
}
