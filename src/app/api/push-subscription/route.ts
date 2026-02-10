import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Get user's push subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        deviceName: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    console.error("Error fetching push subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

/**
 * POST - Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys, userAgent, deviceName } = body;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { error: "Missing required subscription data" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      // Update if it's the same user, or return conflict
      if (existing.userId === session.user.id) {
        const updated = await prisma.pushSubscription.update({
          where: { endpoint },
          data: {
            auth: keys.auth,
            p256dh: keys.p256dh,
            userAgent,
            deviceName,
            isActive: true,
          },
        });
        return NextResponse.json({
          message: "Subscription updated",
          subscription: updated,
        });
      } else {
        return NextResponse.json(
          { error: "Subscription already exists for another user" },
          { status: 409 }
        );
      }
    }

    // Create new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        userAgent,
        deviceName,
      },
    });

    return NextResponse.json(
      { message: "Subscribed successfully", subscription },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating push subscription:", error);
    return NextResponse.json(
      { error: "Failed to subscribe", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      );
    }

    // Mark subscription as inactive
    await prisma.pushSubscription.updateMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error: any) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
