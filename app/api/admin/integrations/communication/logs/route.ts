import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch notifications as communication logs
    const notifications = await prisma.notification.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const logs = notifications.map((notification) => ({
      id: notification.id,
      type: "email" as const,
      provider: "SendGrid",
      recipient: notification.user?.email || "unknown@example.com",
      subject: notification.title,
      status: notification.isRead ? "delivered" : "sent",
      sentAt: notification.createdAt.toISOString(),
      deliveredAt: notification.isRead ? notification.createdAt.toISOString() : null,
      error: null,
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching communication logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
