import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read DB connection info from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });

  // Parse DATABASE_URL: postgresql://user:pass@host:port/dbname
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) return NextResponse.json({ error: "Cannot parse DATABASE_URL" }, { status: 500 });

  const [, user, password, host, port, dbname] = match;

  const backupsDir = path.join(process.cwd(), "backups");
  await mkdir(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup_${dbname}_${timestamp}.sql`;
  const filepath = path.join(backupsDir, filename);

  try {
    await execAsync(
      `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${dbname} -F p -f "${filepath}"`
    );
    return NextResponse.json({ ok: true, filename, message: `Backup saved as backups/${filename}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Backup failed: " + msg }, { status: 500 });
  }
}
