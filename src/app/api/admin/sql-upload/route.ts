import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });

  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) return NextResponse.json({ error: "Cannot parse DATABASE_URL" }, { status: 500 });

  const [, user, password, host, port, dbname] = match;

  const form = await req.formData();
  const file = form.get("sql") as File | null;
  if (!file) return NextResponse.json({ error: "No SQL file provided" }, { status: 400 });

  if (!file.name.endsWith(".sql")) {
    return NextResponse.json({ error: "Only .sql files are accepted" }, { status: 400 });
  }

  // Limit to 50MB
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const tmpDir = path.join(process.cwd(), "backups", "tmp");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `upload_${Date.now()}.sql`);

  const bytes = await file.arrayBuffer();
  await writeFile(tmpPath, Buffer.from(bytes));

  try {
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${dbname} -f "${tmpPath}" 2>&1`
    );
    await unlink(tmpPath);
    const output = (stdout + stderr).slice(0, 2000);
    return NextResponse.json({ ok: true, output });
  } catch (err: unknown) {
    await unlink(tmpPath).catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "SQL execution failed: " + msg }, { status: 500 });
  }
}
