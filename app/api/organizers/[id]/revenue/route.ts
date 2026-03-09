import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify organizer exists and has correct role
    const organizer = await prisma.user.findFirst({
      where: {
        id: id,
        role: "ORGANIZER",
      },
    })

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    // Get date range for revenue analysis (last 12 months)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 12)

    // Fetch revenue data from payments for organizer's events
    const revenueData = await prisma.payment.findMany({
      where: {
        eventRegistrations: {
          some: {
            event: {
              organizerId: id,
            },
          },
        },
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        eventRegistrations: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, payment) => sum + payment.amount, 0)

    // Generate monthly revenue trends
    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format

      const monthPayments = revenueData.filter((payment) => {
        const paymentMonth = payment.createdAt.toISOString().slice(0, 7)
        return paymentMonth === monthKey
      })

      const monthlyTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)

      monthlyRevenue.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthlyTotal,
        transactions: monthPayments.length,
      })
    }

    // Revenue by event
    const eventRevenue = revenueData
      .reduce((acc, payment) => {
        payment.eventRegistrations.forEach((registration) => {
          const eventId = registration.event.id
          const existingEvent = acc.find((e) => e.eventId === eventId)

          if (existingEvent) {
            existingEvent.revenue += payment.amount
            existingEvent.transactions += 1
          } else {
            acc.push({
              eventId: Number.parseInt(eventId.slice(-8), 16),
              title: registration.event.title,
              revenue: payment.amount,
              transactions: 1,
              startDate: registration.event.startDate.toISOString().split("T")[0],
              category: registration.event.category || "Conference",
            })
          }
        })
        return acc
      }, [] as any[])
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by category
    const categoryRevenue = eventRevenue.reduce((acc, event) => {
      const category = event.category
      const existingCategory = acc.find((c:any) => c.category === category)

      if (existingCategory) {
        existingCategory.revenue += event.revenue
        existingCategory.events += 1
      } else {
        acc.push({
          category,
          revenue: event.revenue,
          events: 1,
        })
      }
      return acc
    }, [] as any[])

    // Calculate growth rates
    const currentMonth = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const currentMonthRevenue = revenueData
      .filter((payment) => {
        const paymentDate = payment.createdAt
        return (
          paymentDate.getMonth() === currentMonth.getMonth() && paymentDate.getFullYear() === currentMonth.getFullYear()
        )
      })
      .reduce((sum, payment) => sum + payment.amount, 0)

    const lastMonthRevenue = revenueData
      .filter((payment) => {
        const paymentDate = payment.createdAt
        return paymentDate.getMonth() === lastMonth.getMonth() && paymentDate.getFullYear() === lastMonth.getFullYear()
      })
      .reduce((sum, payment) => sum + payment.amount, 0)

    const monthlyGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // Average transaction value
    const averageTransactionValue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0

    const revenue = {
      overview: {
        totalRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        totalTransactions: revenueData.length,
        averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
        currentMonthRevenue,
        lastMonthRevenue,
      },
      monthlyTrends: monthlyRevenue,
      eventBreakdown: eventRevenue,
      categoryBreakdown: categoryRevenue,
      recentTransactions: revenueData.slice(0, 10).map((payment) => ({
        id: Number.parseInt(payment.id.slice(-8), 16),
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        date: payment.createdAt.toISOString().split("T")[0],
        eventTitle: payment.eventRegistrations[0]?.event.title || "Unknown Event",
        gateway: payment.gateway,
      })),
    }

    return NextResponse.json({ revenue })
  } catch (error) {
    console.error("Error fetching organizer revenue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
