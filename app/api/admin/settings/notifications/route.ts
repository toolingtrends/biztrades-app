import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Get notification stats from database
    const [totalNotifications, readNotifications] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: true } }),
    ])

    // Calculate stats
    const deliveryRate = totalNotifications > 0 ? 98.5 : 0
    const openRate = totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0

    return NextResponse.json({
      stats: {
        totalSent: totalNotifications,
        deliveryRate,
        openRate,
        activeChannels: 3,
      },
    })
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { channels, notificationTypes, schedules, globalSettings } = body

    // In a real application, you would save these settings to the database
    // For now, we just return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving notification settings:", error)
    return NextResponse.json({ error: "Failed to save notification settings" }, { status: 500 })
  }
}
