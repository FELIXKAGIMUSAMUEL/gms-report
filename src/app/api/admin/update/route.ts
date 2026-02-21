import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "GM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync(
      "npx prisma db push --skip-generate --accept-data-loss=false 2>&1",
      { cwd: process.cwd(), timeout: 60000 }
    );
    const output = (stdout + stderr).trim();
    const success = !output.toLowerCase().includes("error");
    return NextResponse.json({ ok: success, output });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
