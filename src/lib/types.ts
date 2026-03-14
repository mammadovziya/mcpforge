export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  implementation?: string; // JS async function body for hosted execution
}

export interface IdeConfig {
  name: string;
  filename: string;
  path: string;
  config: string;
}

export interface GenerateResult {
  repoName: string;
  repoSummary: string;
  tools: McpTool[];
  mcpServerCode: string;
  packageJson: string;
  readme: string;
  setupInstructions: string;
  ideConfigs: IdeConfig[];
  serverId?: string;
  liveUrl?: string;
  installScriptUrl?: string;
  installCommand?: string;
}

export interface ProgressStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface SSEEvent {
  type: "progress" | "complete" | "error";
  step?: string;
  status?: "active" | "done" | "error";
  data?: GenerateResult;
  error?: string;
}

export interface RepoContent {
  readme: string;
  fileTree: string;
  dependencies: string;
  mainFile: string;
  repoName: string;
}
