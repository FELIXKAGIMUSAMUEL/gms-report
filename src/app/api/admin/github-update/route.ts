import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const CONFIG_PATH = path.join(process.cwd(), "github-config.json");
const CWD = process.cwd();

async function readConfig(): Promise<{ repoUrl?: string; token?: string; branch?: string }> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveConfig(cfg: object) {
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

function buildRemoteUrl(repoUrl: string, token: string) {
  // Convert https://github.com/user/repo to https://token@github.com/user/repo
  return repoUrl.replace("https://", `https://${token}@`);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // ── Save config ──────────────────────────────────────────────────────────
  if (action === "save-config") {
    const { repoUrl, token, branch = "main" } = body;
    if (!repoUrl || !token) {
      return NextResponse.json({ error: "repoUrl and token are required" }, { status: 400 });
    }
    await saveConfig({ repoUrl, token, branch });
    return NextResponse.json({ ok: true, message: "GitHub config saved." });
  }

  const config = await readConfig();
  if (!config.repoUrl || !config.token) {
    return NextResponse.json({ error: "GitHub not configured. Please save repo URL and token first." }, { status: 400 });
  }

  const branch = config.branch || "main";
  const remoteUrl = buildRemoteUrl(config.repoUrl, config.token);

  // ── Check for updates ────────────────────────────────────────────────────
  if (action === "check") {
    try {
      // Set remote URL temporarily for fetch
      await execAsync(`git remote set-url origin "${remoteUrl}"`, { cwd: CWD });
      await execAsync(`git fetch origin ${branch}`, { cwd: CWD, timeout: 30000 });
      const { stdout: logOut } = await execAsync(
        `git log HEAD..origin/${branch} --oneline`, { cwd: CWD }
      );
      const { stdout: statusOut } = await execAsync(`git status --short`, { cwd: CWD });
      const commits = logOut.trim();
      const hasUpdates = commits.length > 0;
      return NextResponse.json({
        ok: true,
        hasUpdates,
        commits: commits || "None — already up to date.",
        localStatus: statusOut.trim() || "Clean",
        branch,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Apply update (git pull + npm install + prisma db push) ───────────────
  if (action === "apply") {
    const steps: string[] = [];
    try {
      await execAsync(`git remote set-url origin "${remoteUrl}"`, { cwd: CWD });

      const { stdout: pull } = await execAsync(
        `git pull origin ${branch} --no-rebase 2>&1`, { cwd: CWD, timeout: 60000 }
      );
      steps.push(`[git pull]\n${pull.trim()}`);

      const { stdout: install } = await execAsync(
        `npm install --legacy-peer-deps 2>&1`, { cwd: CWD, timeout: 120000 }
      );
      steps.push(`[npm install]\n${install.slice(-500).trim()}`);

      const { stdout: push } = await execAsync(
        `npx prisma db push --skip-generate 2>&1`, { cwd: CWD, timeout: 60000 }
      );
      steps.push(`[prisma db push]\n${push.trim()}`);

      // Generate Prisma client
      const { stdout: gen } = await execAsync(
        `npx prisma generate 2>&1`, { cwd: CWD, timeout: 60000 }
      );
      steps.push(`[prisma generate]\n${gen.slice(-300).trim()}`);

      return NextResponse.json({ ok: true, output: steps.join("\n\n") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        error: msg,
        partialOutput: steps.join("\n\n"),
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = await readConfig();
  return NextResponse.json({ repoUrl: config.repoUrl || "", branch: config.branch || "main", configured: !!(config.repoUrl && config.token) });
}
