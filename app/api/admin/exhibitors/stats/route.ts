import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get exhibitor statistics
    const [
      totalExhibitors,
      activeExhibitors,
      pendingExhibitors,
      suspendedExhibitors,
      verifiedExhibitors,
      industryStats,
    ] = await Promise.all([
      // Total exhibitors
      prisma.user.count({
        where: { role: "EXHIBITOR" },
      }),

      // Active exhibitors
      prisma.user.count({
        where: { 
          role: "EXHIBITOR",
          isActive: true 
        },
      }),

      // Pending exhibitors (not verified but active)
      prisma.user.count({
        where: { 
          role: "EXHIBITOR",
          isActive: true,
          isVerified: false 
        },
      }),

      // Suspended exhibitors
      prisma.user.count({
        where: { 
          role: "EXHIBITOR",
          isActive: false 
        },
      }),

      // Verified exhibitors
      prisma.user.count({
        where: { 
          role: "EXHIBITOR",
          isVerified: true 
        },
      }),

      // Industry distribution
      prisma.user.groupBy({
        by: ['companyIndustry'],
        where: { 
          role: "EXHIBITOR",
          companyIndustry: { not: null } 
        },
        _count: {
          _all: true,
        },
      }),
    ])

    // Calculate average rating and revenue (mock data for now)
    const avgRating = 4.5
    const totalRevenue = 1250000

    const stats = {
      total: totalExhibitors,
      active: activeExhibitors,
      pending: pendingExhibitors,
      suspended: suspendedExhibitors,
      verified: verifiedExhibitors,
      totalRevenue,
      avgRating,
      industryDistribution: industryStats.reduce((acc, item) => {
        if (item.companyIndustry) {
          acc[item.companyIndustry] = item._count._all
        }
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching exhibitor stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}