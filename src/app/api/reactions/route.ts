import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push-notifications";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reactions = await prisma.reaction.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reactions);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sectionId, type, comment, weeklyReportId } = body;
    const normalizedWeeklyReportId = typeof weeklyReportId === "string" ? weeklyReportId : null;
    const normalizedComment = typeof comment === "string" ? comment.trim() : undefined;

    if (!sectionId || !type) {
      return NextResponse.json({ error: "Missing required fields: sectionId, type" }, { status: 400 });
    }

    if (type === "COMMENT") {
      if (!normalizedComment) {
        return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
      }
      if (normalizedComment.length > 5000) {
        return NextResponse.json({ error: "Comment is too long. Maximum is 5000 characters." }, { status: 400 });
      }
    }

    // Toggleable thumbs up/down per user per section/report
    const isThumb = type === "THUMBS_UP" || type === "THUMBS_DOWN";

    if (isThumb) {
      const existingThumb = await prisma.reaction.findFirst({
        where: {
          userId: session.user.id,
          weeklyReportId: normalizedWeeklyReportId,
          sectionId,
          type: { in: ["THUMBS_UP", "THUMBS_DOWN"] },
        },
      });

      // Second click on same reaction toggles it off
      if (existingThumb && existingThumb.type === type) {
        await prisma.reaction.delete({ where: { id: existingThumb.id } });
        return NextResponse.json({ deleted: true, id: existingThumb.id });
      }

      // Switch from like to dislike (or vice versa)
      if (existingThumb && existingThumb.type !== type) {
        const updated = await prisma.reaction.update({
          where: { id: existingThumb.id },
          data: { type },
          include: {
            user: { select: { name: true } },
          },
        });
        return NextResponse.json(updated);
      }
    }

    const reaction = await prisma.reaction.create({
      data: {
        sectionId,
        type,
        comment: normalizedComment,
        userId: session.user.id,
        weeklyReportId: normalizedWeeklyReportId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Notify all trustees when GM posts a comment
    if (session.user.role === 'GM' && type === 'COMMENT' && normalizedComment) {
      try {
        const trustees = await prisma.user.findMany({
          where: { role: 'TRUSTEE' },
          select: { id: true },
        });

        const preview = normalizedComment.substring(0, 180);
        const notificationData = trustees.map(trustee => ({
          type: 'REPORT_COMMENT' as const,
          title: `GM posted a comment`,
          message: preview,
          data: JSON.stringify({
            reactionId: reaction.id,
            sectionId,
            weeklyReportId: normalizedWeeklyReportId,
          }),
          userId: trustee.id,
          isRead: false,
        }));

        if (notificationData.length > 0) {
          await prisma.notification.createMany({
            data: notificationData,
          });

          // Send push notifications to trustees
          for (const trustee of trustees) {
            sendPushToUser(trustee.id, {
              title: "GM posted a comment",
              message: preview,
              url: "/dashboard",
              tag: `reaction-${reaction.id}`,
            }).catch(err => console.error("Failed to send push:", err));
          }
        }
      } catch (notifyError) {
        console.error("Notification pipeline failed, reaction still saved:", notifyError);
      }
    }

    // Notify GM when trustee reacts
    if (session.user.role === 'TRUSTEE') {
      try {
        const gm = await prisma.user.findFirst({
          where: { role: 'GM' },
          select: { id: true },
        });

        if (gm) {
          let notificationTitle = '';
          let notificationMessage = '';

          if (type === 'THUMBS_UP') {
            notificationTitle = `${session.user.name || 'A trustee'} liked a report section`;
            notificationMessage = `Thumbs up on section: ${sectionId}`;
          } else if (type === 'THUMBS_DOWN') {
            notificationTitle = `${session.user.name || 'A trustee'} disliked a report section`;
            notificationMessage = `Thumbs down on section: ${sectionId}`;
          } else if (type === 'COMMENT' && normalizedComment) {
            notificationTitle = `${session.user.name || 'A trustee'} commented`;
            notificationMessage = normalizedComment.substring(0, 180);
          }

          if (notificationTitle) {
            await prisma.notification.create({
              data: {
                type: 'REPORT_COMMENT' as const,
                title: notificationTitle,
                message: notificationMessage,
                data: JSON.stringify({
                  reactionId: reaction.id,
                  sectionId,
                  weeklyReportId: normalizedWeeklyReportId,
                }),
                userId: gm.id,
                isRead: false,
              },
            });

            // Send push notification to GM
            sendPushToUser(gm.id, {
              title: notificationTitle,
              message: notificationMessage,
              url: "/dashboard",
              tag: `reaction-${reaction.id}`,
            }).catch(err => console.error("Failed to send push:", err));
          }
        }
      } catch (notifyError) {
        console.error("GM notification pipeline failed, reaction still saved:", notifyError);
      }
    }

    return NextResponse.json(reaction);
  } catch (error: any) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
