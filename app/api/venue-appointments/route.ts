import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

// --------------------- CREATE APPOINTMENT ---------------------
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    const body = await request.json()
    const {
      venueId,
      title,
      description,
      type = "VENUE_TOUR",
      requestedDate,
      requestedTime,
      duration = 30,
      meetingType = "IN_PERSON",
      purpose,
      requesterCompany,
      requesterTitle,
      requesterPhone,
      requesterEmail,
      eventType,
      expectedAttendees,
      eventDate,
      meetingSpacesInterested = [],
      location,
      agenda = [],
    } = body

    // Required fields
    if (!venueId || !title || !requestedDate || !requestedTime) {
      return NextResponse.json(
        { error: "Missing required fields: venueId, title, requestedDate, requestedTime" },
        { status: 400 },
      )
    }

    // Validate venue
    const venue = await prisma.user.findUnique({
      where: { id: venueId },
      select: { id: true, role: true },
    })

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 })
    }

    if (venue.role !== "VENUE_MANAGER") {
      return NextResponse.json({ error: "Invalid venue. User is not a venue manager." }, { status: 400 })
    }

    // Create appointment
    const appointment = await prisma.venueAppointment.create({
      data: {
        venueId,
        requesterId: session.user.id,
        title,
        description,
        type,
        status: "PENDING",
        priority: "MEDIUM",
        requestedDate: new Date(requestedDate),
        requestedTime,
        duration,
        meetingType,
        purpose,
        requesterCompany,
        requesterTitle,
        requesterPhone,
        requesterEmail,
        eventType,
        expectedAttendees,
        eventDate: eventDate ? new Date(eventDate) : null,
        meetingSpacesInterested,
        location,
        agenda,
        reminderSent: false,
        followUpRequired: true,
      },
      include: {
        venue: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Venue appointment created successfully",
        data: appointment,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// --------------------- GET APPOINTMENTS ---------------------
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get("venueId")
    const requesterId = searchParams.get("requesterId")

    const where: any = {}

    if (venueId) where.venueId = venueId
    if (requesterId) where.requesterId = requesterId

    if (!venueId && !requesterId) {
      // show appointments related to logged-in user
      where.OR = [{ venueId: session.user.id }, { requesterId: session.user.id }]
    }

    const appointments = await prisma.venueAppointment.findMany({
      where,
      include: {
        venue: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      {
        success: true,
        data: appointments,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// --------------------- UPDATE APPOINTMENT STATUS ---------------------
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Missing appointment ID or status" }, { status: 400 })
    }

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Check if user has permission to update this appointment
    const existingAppointment = await prisma.venueAppointment.findUnique({
      where: { id },
      select: { venueId: true, requesterId: true }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // User can only update if they are the venue or requester
    if (existingAppointment.venueId !== session.user.id && existingAppointment.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this appointment" }, { status: 403 })
    }

    const appointment = await prisma.venueAppointment.update({
      where: { id },
      data: { status },
      include: {
        venue: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Appointment ${status.toLowerCase()} successfully`,
        data: appointment,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      {
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Add PUT method that calls the same logic as PATCH
export async function PUT(request: NextRequest) {
  return PATCH(request)
}