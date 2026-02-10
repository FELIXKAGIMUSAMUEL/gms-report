import webPush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (publicKey && privateKey) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    // Get all active subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      console.log(`No active push subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: any) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        };

        try {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          console.error(
            `Failed to send push to subscription ${subscription.id}:`,
            error
          );

          // If subscription is no longer valid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }

          return { success: false, subscriptionId: subscription.id, error };
        }
      })
    );

    const sent = results.filter(
      (r: any) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - sent;

    return { sent, failed, total: results.length };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );

  const summary = results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled" && result.value) {
        acc.sent += result.value.sent || 0;
        acc.failed += result.value.failed || 0;
        acc.total += result.value.total || 0;
      }
      return acc;
    },
    { sent: 0, failed: 0, total: 0 }
  );

  return summary;
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendPushToRole(
  role: "GM" | "TRUSTEE",
  payload: PushPayload
) {
  const users = await prisma.user.findMany({
    where: { role: role as any },
    select: { id: true },
  });

  const userIds = users.map((u: any) => u.id);
  return sendPushToUsers(userIds, payload);
}

/**
 * Send push notification with database notification record
 */
export async function sendNotificationWithPush(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: string;
    url?: string;
  }
) {
  // Create database notification
  const dbNotification = await prisma.notification.create({
    data: {
      userId,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    },
  });

  // Send push notification
  await sendPushToUser(userId, {
    title: notification.title,
    message: notification.message,
    url: notification.url || "/dashboard",
    tag: `notification-${dbNotification.id}`,
    data: {
      notificationId: dbNotification.id,
      ...JSON.parse(notification.data || "{}"),
    },
  });

  return dbNotification;
}
