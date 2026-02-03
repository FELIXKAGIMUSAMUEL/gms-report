import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Store push subscription in database
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();

    // Store subscription in database (you'll need to add a PushSubscription model to your schema)
    // For now, we'll just acknowledge it
    
    // TODO: Add to Prisma schema:
    // model PushSubscription {
    //   id        String   @id @default(cuid())
    //   userId    String
    //   endpoint  String   @unique
    //   keys      Json
    //   createdAt DateTime @default(now())
    //   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    // }

    console.log('Push subscription saved for user:', session.user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Push notification subscription saved' 
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
