import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { userId, role } = decoded
    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get("userId")
    const requestedRole = searchParams.get("role")

    // Additional security check
    if (userId !== requestedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    let permissions: string[] = []

    if (role === "SUPER_ADMIN") {
      // SUPER_ADMIN has all permissions
      permissions = [
        "dashboard-overview",
        "events", "events-all", "events-create", "events-categories",
        "organizers", "organizers-all", "organizers-add",
        "exhibitors", "exhibitors-all", "exhibitors-add",
        "speakers", "speakers-all", "speakers-add",
        "venues", "venues-all", "venues-add",
        "visitors", "visitors-events", "visitors-connections",
        "financial", "financial-payments", "financial-subscriptions", "financial-invoices", "financial-transactions",
        "content", "content-news", "content-blog",
        "reports", "reports-events", "reports-engagement",
        "integrations", "integrations-payment", "integrations-api",
        "roles", "roles-superadmin", "roles-subadmins",
        "settings", "settings-notifications", "settings-security",
        "support", "support-tickets", "support-notes"
      ]
    } else if (role === "SUB_ADMIN") {
      // Fetch sub-admin permissions from database
      const subAdmin = await prisma.subAdmin.findUnique({
        where: {
          id: userId,
          isActive: true,
        },
        select: {
          permissions: true,
        },
      })

      if (!subAdmin) {
        return NextResponse.json({ error: "Sub-admin not found or inactive" }, { status: 404 })
      }

      permissions = subAdmin.permissions
    }

    return NextResponse.json({
      userId,
      role,
      permissions,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Permissions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}