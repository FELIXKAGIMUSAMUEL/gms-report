import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, isValidEmail, validatePasswordStrength } from "@/lib/security";

const requireAccess = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!currentUser || (currentUser.role !== "GM" && currentUser.role !== "TRUSTEE")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), currentUser };
  }

  return { currentUser };
};

export async function GET() {
  try {
    const { error } = await requireAccess();
    if (error) return error;

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAccess();
    if (error) return error;

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !isValidEmail(String(email))) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    const strength = validatePasswordStrength(String(password));
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.errors.join(". ") }, { status: 400 });
    }

    const normalizedRole = String(role || "GM").toUpperCase();
    if (normalizedRole !== "GM" && normalizedRole !== "TRUSTEE") {
      return NextResponse.json({ error: "Role must be GM or TRUSTEE" }, { status: 400 });
    }

    const hashed = await hashPassword(String(password));

    const created = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        password: hashed,
        role: normalizedRole,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error, currentUser } = await requireAccess();
    if (error) return error;

    const body = await request.json();
    const { id, name, email, role, password } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (email !== undefined) {
      if (!isValidEmail(String(email))) {
        return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
      }
      data.email = String(email).toLowerCase().trim();
    }
    if (role !== undefined) {
      const normalizedRole = String(role).toUpperCase();
      if (normalizedRole !== "GM" && normalizedRole !== "TRUSTEE") {
        return NextResponse.json({ error: "Role must be GM or TRUSTEE" }, { status: 400 });
      }
      data.role = normalizedRole;
    }
    if (password !== undefined && String(password).trim()) {
      const strength = validatePasswordStrength(String(password));
      if (!strength.isValid) {
        return NextResponse.json({ error: strength.errors.join(". ") }, { status: 400 });
      }
      data.password = await hashPassword(String(password));
    }

    if (currentUser?.id === id && data.role && data.role !== currentUser.role) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, currentUser } = await requireAccess();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (currentUser?.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
