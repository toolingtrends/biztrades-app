import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    const recentLogs = await prisma.adminLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        superAdmin: { select: { name: true, email: true } },
        subAdmin: { select: { name: true, email: true } },
      },
    })

    const activities = recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource || "General",
      adminType: log.adminType,
      adminName:
        log.superAdmin?.name || log.subAdmin?.name || "Unknown Admin",
      timestamp: log.createdAt,
      icon:
        log.action.toLowerCase().includes("approve") ||
        log.action.toLowerCase().includes("create")
          ? "success"
          : log.action.toLowerCase().includes("delete") ||
            log.action.toLowerCase().includes("flag")
          ? "error"
          : "info",
      description:
        typeof log.details === "object" &&
        log.details !== null &&
        "message" in log.details
          ? (log.details as Record<string, any>).message
          : "",
    }))

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { error: "Failed to load recent activity" },
      { status: 500 }
    )
  }
}
