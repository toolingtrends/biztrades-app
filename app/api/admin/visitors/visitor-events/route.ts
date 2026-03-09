import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch all visitors (users with ATTENDEE role) with their event registrations
    const visitors = await prisma.user.findMany({
      where: {
        role: "ATTENDEE",
      },
      include: {
        registrations: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform the data to match frontend expectations
    const visitorEvents = visitors.map((visitor) => {
      const registrations = visitor.registrations.map((reg) => ({
        id: reg.id,
        eventId: reg.eventId,
        eventTitle: reg.event?.title || "Unknown Event",
        eventDate: reg.event?.startDate?.toISOString() || new Date().toISOString(),
        status: reg.status,
        registeredAt: reg.registeredAt.toISOString(),
        ticketType: reg.ticketTypeId || "General",
        totalAmount: reg.totalAmount,
      }))

      const stats = {
        totalRegistrations: registrations.length,
        confirmedEvents: registrations.filter((r) => r.status === "CONFIRMED").length,
        pendingEvents: registrations.filter((r) => r.status === "PENDING").length,
        cancelledEvents: registrations.filter((r) => r.status === "CANCELLED").length,
      }

      return {
        id: visitor.id,
        visitor: {
          id: visitor.id,
          name: `${visitor.firstName} ${visitor.lastName}`,
          email: visitor.email || "",
          phone: visitor.phone,
          avatar: visitor.avatar,

         
        },
        registrations,
        stats,
      }
    })

    return NextResponse.json(visitorEvents)
  } catch (error) {
    console.error("Error fetching visitor events:", error)
    return NextResponse.json(
      { error: "Failed to fetch visitor events" },
      { status: 500 }
    )
  }
}
