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

    // Fetch attendees for organizer's events
    const attendees = await prisma.eventRegistration.findMany({
      where: {
        event: {
          organizerId: id,
        },
      },
      select: {
        id: true,
        quantity: true,
        totalAmount: true,
        status: true,
        registeredAt: true,
        specialRequests: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            company: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        ticketTypeId: true,
      },
      orderBy: {
        registeredAt: "desc",
      },
    })

    // Transform attendees to match component interface
    const transformedAttendees = attendees.map((attendee) => ({
      id: Number.parseInt(attendee.id.slice(-8), 16), // Convert ObjectId to number for compatibility
      name: `${attendee.user.firstName} ${attendee.user.lastName}`,
      email: attendee.user.email,
      phone: attendee.user.phone || "",
      company: attendee.user.company || "",
      avatar: attendee.user.avatar || "/placeholder.svg?height=40&width=40&text=Avatar",
      event: attendee.event.title,
      eventDate: attendee.event.startDate.toISOString().split("T")[0],
      registrationDate: attendee.registeredAt.toISOString().split("T")[0],
      status: attendee.status.toLowerCase(),
      ticketType: attendee.ticketTypeId || "General",
      quantity: attendee.quantity,
      totalAmount: attendee.totalAmount,
    }))

    return NextResponse.json({ attendees: transformedAttendees })
  } catch (error) {
    console.error("Error fetching attendees:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
