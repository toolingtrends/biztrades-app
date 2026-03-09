import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch single push notification
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ⭐ REQUIRED FIX ⭐

    const notification = await prisma.pushNotification.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
        sentAt: notification.sentAt?.toISOString(),
        scheduledAt: notification.scheduledAt?.toISOString(),
        recipients: notification.recipients.map((r) => ({
          ...r,
          sentAt: r.sentAt?.toISOString(),
          deliveredAt: r.deliveredAt?.toISOString(),
          openedAt: r.openedAt?.toISOString(),
          clickedAt: r.clickedAt?.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

// PUT - Update notification
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ⭐ FIX ⭐
    const body = await request.json();

    const updated = await prisma.pushNotification.update({
      where: { id },
      data: {
        title: body.title,
        message: body.bodyText || body.message,
        imageUrl: body.imageUrl,
        actionUrl: body.actionUrl,
        status: body.status,
        priority: body.priority,
        targetAudiences: body.targetAudiences,
        targetPlatforms: body.targetPlatforms,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Notification updated successfully",
    });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ⭐ FIX ⭐

    await prisma.pushNotification.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
