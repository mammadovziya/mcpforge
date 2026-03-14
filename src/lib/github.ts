import { RepoContent } from "./types";

const GITHUB_API = "https://api.github.com";

export function parseRepoUrl(url: string): { owner: string; repo: string } {
  // Handle various GitHub URL formats
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");

  // Match: github.com/owner/repo (with or without protocol, www, tree/blob paths)
  const match = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/
  );

  if (!match) {
    throw new Error(
      "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
    );
  }

  return { owner: match[1], repo: match[2] };
}

async function githubFetch(
  path: string,
  options?: { raw?: boolean }
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: options?.raw
      ? "application/vnd.github.v3.raw"
      : "application/vnd.github.v3+json",
    "User-Agent": "MCPForge",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers });

  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new Error(
        "GitHub API rate limit reached. Try again later or add a GITHUB_TOKEN to .env.local for higher limits."
      );
    }
    throw new Error(
      "Access denied. This repository may be private. Make sure it is public or provide a GITHUB_TOKEN."
    );
  }

  return res;
}

export async function fetchRepoContent(
  owner: string,
  repo: string
): Promise<RepoContent> {
  // Verify repo exists
  const repoRes = await githubFetch(`/repos/${owner}/${repo}`);
  if (repoRes.status === 404) {
    throw new Error(
      `Repository ${owner}/${repo} not found. Check the URL and ensure the repository is public.`
    );
  }
  if (!repoRes.ok) {
    throw new Error(`Failed to access repository: ${repoRes.statusText}`);
  }

  // Fetch all content in parallel
  const [readmeRes, treeRes, packageJsonRes, requirementsRes] =
    await Promise.allSettled([
      githubFetch(`/repos/${owner}/${repo}/readme`, { raw: true }),
      githubFetch(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`),
      githubFetch(`/repos/${owner}/${repo}/contents/package.json`, {
        raw: true,
      }),
      githubFetch(`/repos/${owner}/${repo}/contents/requirements.txt`, {
        raw: true,
      }),
    ]);

  // README
  let readme = "(No README found)";
  if (readmeRes.status === "fulfilled" && readmeRes.value.ok) {
    readme = await readmeRes.value.text();
    // Truncate very long READMEs to save tokens
    if (readme.length > 8000) {
      readme = readme.substring(0, 8000) + "\n\n[... truncated for brevity]";
    }
  }

  // File tree
  let fileTree = "";
  if (treeRes.status === "fulfilled" && treeRes.value.ok) {
    const treeData = await treeRes.value.json();
    const tree = treeData.tree || [];
    // Show first 100 files max to save tokens
    const entries = tree.slice(0, 100).map(
      (item: { path: string; type: string }) =>
        `${item.type === "tree" ? "dir" : "file"}: ${item.path}`
    );
    fileTree = entries.join("\n");
    if (tree.length > 100) {
      fileTree += `\n... and ${tree.length - 100} more files`;
    }
  }

  // Dependencies
  let dependencies = "(No dependency file found)";
  if (packageJsonRes.status === "fulfilled" && packageJsonRes.value.ok) {
    dependencies = await packageJsonRes.value.text();
    if (dependencies.length > 4000) {
      dependencies =
        dependencies.substring(0, 4000) + "\n... truncated for brevity";
    }
  } else if (
    requirementsRes.status === "fulfilled" &&
    requirementsRes.value.ok
  ) {
    dependencies = await requirementsRes.value.text();
  }

  // Detect and fetch main entry file
  let mainFile = "(No main entry file detected)";
  const mainCandidates = [
    "index.js",
    "index.ts",
    "src/index.js",
    "src/index.ts",
    "src/main.ts",
    "src/main.js",
    "main.py",
    "app.py",
    "src/app.ts",
    "src/app.js",
    "lib/index.js",
    "lib/index.ts",
    "cli.js",
    "src/cli.ts",
  ];

  for (const candidate of mainCandidates) {
    try {
      const res = await githubFetch(
        `/repos/${owner}/${repo}/contents/${candidate}`,
        { raw: true }
      );
      if (res.ok) {
        mainFile = await res.text();
        if (mainFile.length > 6000) {
          mainFile =
            mainFile.substring(0, 6000) + "\n\n[... truncated for brevity]";
        }
        mainFile = `File: ${candidate}\n\n${mainFile}`;
        break;
      }
    } catch {
      // Skip this candidate
    }
  }

  return {
    readme,
    fileTree,
    dependencies,
    mainFile,
    repoName: repo,
  };
}
