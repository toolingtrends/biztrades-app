import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.venueAppointment.findUnique({
      where: { id: params.id },
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
    })

    if (!appointment) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const formattedBooking = {
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
    }

    return NextResponse.json(formattedBooking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, notes } = body

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === "CONFIRMED") {
      updateData.confirmedDate = new Date()
    }

    if (notes) {
      updateData.notes = notes
    }

    const appointment = await prisma.venueAppointment.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: appointment,
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}
