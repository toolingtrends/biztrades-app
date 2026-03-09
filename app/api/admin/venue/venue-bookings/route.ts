import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {}

    if (status && status !== "all") {
      where.status = status
    }

    const appointments = await prisma.venueAppointment.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            venueName: true,
            venuePhone: true,
            venueEmail: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedBookings = appointments.map((appointment) => ({
      id: appointment.id,
      venueId: appointment.venueId || "",
      venueName: appointment.venue?.venueName || `${appointment.venue?.firstName || ""} ${appointment.venue?.lastName || ""}`.trim(),
      venuePhone: appointment.venue?.venuePhone || appointment.venue?.phone || "",
      venueEmail: appointment.venue?.venueEmail || appointment.venue?.email || "",
      requesterId: appointment.requesterId || "",
      requesterName: `${appointment.requester?.firstName || ""} ${appointment.requester?.lastName || ""}`.trim(),
      requesterEmail: appointment.requesterEmail || appointment.requester?.email || "",
      requesterPhone: appointment.requesterPhone || appointment.requester?.phone || "",
      requesterCompany: appointment.requesterCompany || appointment.requester?.company || "",
      title: appointment.title,
      description: appointment.description || "",
      type: appointment.type,
      status: appointment.status,
      priority: appointment.priority,
      requestedDate: appointment.requestedDate.toISOString(),
      requestedTime: appointment.requestedTime,
      duration: appointment.duration,
      confirmedDate: appointment.confirmedDate?.toISOString() || null,
      confirmedTime: appointment.confirmedTime || null,
      meetingType: appointment.meetingType,
      location: appointment.location || "",
      purpose: appointment.purpose || "",
      eventType: appointment.eventType || "",
      expectedAttendees: appointment.expectedAttendees || 0,
      createdAt: appointment.createdAt.toISOString(),
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error("Error fetching venue bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch venue bookings" },
      { status: 500 }
    )
  }
}
