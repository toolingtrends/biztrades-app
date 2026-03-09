import { type NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointment = await prisma.venueAppointment.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            venueName: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
            venuePhone: true,
            venueEmail: true,
            maxCapacity: true,
            totalHalls: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            organizationName: true,
            company: true,
            jobTitle: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const formattedAppointment = {
      id: appointment.id,
    
      startDate: appointment.requestedDate.toISOString(),
      endDate: appointment.confirmedDate
        ? appointment.confirmedDate.toISOString()
        : appointment.requestedDate.toISOString(),
      totalAmount: 0,
      currency: "USD",
      status: appointment.status,
      purpose: appointment.purpose || "Not specified",
      specialRequests: appointment.notes || "None",
      meetingSpaces: appointment.meetingSpacesInterested || [],
      type: appointment.type,
      title: appointment.title,
      description: appointment.description,
      duration: appointment.duration,
      meetingType: appointment.meetingType,
      location: appointment.location,
      meetingLink: appointment.meetingLink,
      agenda: appointment.agenda || [],
      expectedAttendees: appointment.expectedAttendees,
      eventType: appointment.eventType,
      eventDate: appointment.eventDate?.toISOString(),
      payment: null, // VenueAppointment doesn't have payment
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    }

    return NextResponse.json(formattedAppointment)
  } catch (error) {
    console.error("Error fetching appointment details:", error)
    return NextResponse.json({ error: "Failed to fetch appointment details" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const updatedAppointment = await prisma.venueAppointment.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date(),
        // If confirming, set confirmed date
        ...(status === "CONFIRMED" && !params.id.includes("confirmed")
          ? {
              confirmedDate: new Date(),
            }
          : {}),
      },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            venueName: true,
            venueAddress: true,
            venueCity: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Appointment status updated successfully",
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return NextResponse.json({ error: "Failed to update appointment status" }, { status: 500 })
  }
}
