import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Toggleable thumbs up/down per user per section/report
    const isThumb = type === "THUMBS_UP" || type === "THUMBS_DOWN";

    if (isThumb) {
      const existingThumb = await prisma.reaction.findFirst({
        where: {
          userId: session.user.id,
          weeklyReportId,
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
        comment,
        userId: session.user.id,
        weeklyReportId,
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
    if (session.user.role === 'GM' && type === 'COMMENT' && comment) {
      const trustees = await prisma.user.findMany({
        where: { role: 'TRUSTEE' },
        select: { id: true },
      });

      const notificationData = trustees.map(trustee => ({
        type: 'REPORT_COMMENT' as const,
        title: `GM posted a comment`,
        message: comment.substring(0, 100),
        data: JSON.stringify({
          reactionId: reaction.id,
          sectionId,
          weeklyReportId,
        }),
        userId: trustee.id,
        isRead: false,
      }));

      if (notificationData.length > 0) {
        await prisma.notification.createMany({
          data: notificationData,
        });
      }
    }

    // Notify GM when trustee reacts
    if (session.user.role === 'TRUSTEE') {
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
        } else if (type === 'COMMENT' && comment) {
          notificationTitle = `${session.user.name || 'A trustee'} commented`;
          notificationMessage = comment.substring(0, 100);
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
                weeklyReportId,
              }),
              userId: gm.id,
              isRead: false,
            },
          });
        }
      }
    }

    return NextResponse.json(reaction);
  } catch (error) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
