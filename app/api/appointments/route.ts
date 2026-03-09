import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const exhibitorId = url.searchParams.get("exhibitorId")
    const requesterId = url.searchParams.get("requesterId")
    const eventId = url.searchParams.get("eventId")

    if (!exhibitorId && !requesterId && !eventId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    let appointments: any[] = []

    try {
      if (exhibitorId) {
        // Get appointments for exhibitor
        appointments = await prisma.appointment.findMany({
          where: { exhibitorId },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true,
                jobTitle: true,
                avatar: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      } else if (requesterId) {
        // Get appointments for requester
        appointments = await prisma.appointment.findMany({
          where: { requesterId },
          include: {
            exhibitor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                avatar: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      } else if (eventId) {
        // Get all appointments for event
        appointments = await prisma.appointment.findMany({
          where: { eventId },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true,
                jobTitle: true,
                avatar: true,
              },
            },
            exhibitor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      appointments = []
    }

    // Transform to match expected format
// Transform to match expected format
const formattedAppointments = appointments.map((appointment: any) => ({
  id: appointment.id,
  eventId: appointment.event?.id || appointment.eventId,
  eventName: appointment.event?.title || "Unknown Event",
  eventStartDate: appointment.event?.startDate || null,
  eventEndDate: appointment.event?.endDate || null,
  visitorName: appointment.requester
    ? `${appointment.requester.firstName || ""} ${appointment.requester.lastName || ""}`.trim()
    : "Unknown Visitor",
  visitorEmail: appointment.requester?.email || appointment.requesterEmail || "",
  visitorPhone: appointment.requester?.phone || appointment.requesterPhone || "",
  company: appointment.requester?.company || appointment.requesterCompany || "Unknown",
  designation: appointment.requester?.jobTitle || appointment.requesterTitle || "Unknown",
  requestedDate: appointment.requestedDate
    ? new Date(appointment.requestedDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0],
  requestedTime: appointment.requestedTime || "09:00",
  duration: `${appointment.duration || 60} minutes`,
  purpose: appointment.purpose || appointment.description || "General meeting",
  status: appointment.status || "PENDING",
  priority: appointment.priority || "MEDIUM",
  profileViews: Math.floor(Math.random() * 50) + 1,
  previousMeetings: Math.floor(Math.random() * 5),
  notes: appointment.notes || "",
  meetingLink: appointment.meetingLink || "",
  location: appointment.location || "",
}));


    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
      total: formattedAppointments.length,
    })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        appointments: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/appointments called")
    const session = await getServerSession(authOptions)
    console.log("Session:", session)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const {
      eventId,
      exhibitorId,
      requesterId,
      title,
      description,
      type = "CONSULTATION",
      requestedDate,
      requestedTime,
      duration = 60,
      meetingType = "IN_PERSON",
      location,
      purpose,
      agenda = [],
      notes = "",
      priority = "MEDIUM",
    } = body

    // Validate required fields
    if (!eventId || !exhibitorId || !requesterId || !title || !requestedDate || !requestedTime) {
      const missing = []
      if (!eventId) missing.push("eventId")
      if (!exhibitorId) missing.push("exhibitorId")
      if (!requesterId) missing.push("requesterId")
      if (!title) missing.push("title")
      if (!requestedDate) missing.push("requestedDate")
      if (!requestedTime) missing.push("requestedTime")
      
      console.log("Missing required fields:", missing)
      return NextResponse.json({ 
        error: "Missing required fields", 
        missing,
        received: { eventId, exhibitorId, requesterId, title, requestedDate, requestedTime }
      }, { status: 400 })
    }

    // Validate date format
    const parsedDate = new Date(requestedDate)
    if (isNaN(parsedDate.getTime())) {
      console.log("Invalid date format:", requestedDate)
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    try {
      // First, validate that the event exists
      console.log("Checking if event exists:", eventId)
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true }
      })

      if (!event) {
        console.log("Event not found:", eventId)
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      console.log("Event found:", event)

      // Validate that both users exist
      console.log("Checking users exist - requester:", requesterId, "exhibitor:", exhibitorId)
      const [requester, exhibitor] = await Promise.all([
        prisma.user.findUnique({
          where: { id: requesterId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            jobTitle: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: exhibitorId },
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            email: true,
            company: true 
          },
        })
      ])

      if (!requester) {
        console.log("Requester not found:", requesterId)
        return NextResponse.json({ error: "Requester not found" }, { status: 404 })
      }
      console.log("Requester found:", requester.firstName, requester.lastName)

      if (!exhibitor) {
        console.log("Exhibitor not found:", exhibitorId)
        return NextResponse.json({ error: "Exhibitor not found" }, { status: 404 })
      }
      console.log("Exhibitor found:", exhibitor.firstName, exhibitor.lastName)

      // Check if appointment already exists
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          eventId,
          exhibitorId,
          requesterId,
          requestedDate: parsedDate,
          requestedTime,
          status: {
            not: "CANCELLED"
          }
        }
      })

      if (existingAppointment) {
        console.log("Appointment already exists:", existingAppointment.id)
        return NextResponse.json({ 
          error: "An appointment already exists for this time slot" 
        }, { status: 409 })
      }

      // Create the appointment
      console.log("Creating appointment...")
      const appointment = await prisma.appointment.create({
        data: {
          eventId,
          exhibitorId,
          requesterId,
          title,
          description: description || "",
          type,
          requestedDate: parsedDate,
          requestedTime,
          duration: Number(duration),
          meetingType,
          location: location || "",
          purpose: purpose || "",
          agenda,
          notes,
          priority,
          requesterCompany: requester.company || "",
          requesterTitle: requester.jobTitle || "",
          requesterPhone: requester.phone || "",
          requesterEmail: requester.email || "",
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              avatar: true,
            },
          },
          exhibitor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              avatar: true,
              // title: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      console.log("Appointment created successfully:", appointment.id)

      // Create notification for exhibitor
      try {
        await prisma.notification.create({
          data: {
            userId: exhibitorId,
            type: "APPOINTMENT_REQUEST",
            title: "New Meeting Request",
            message: `${requester.firstName} ${requester.lastName} has requested a meeting: ${title}`,
            metadata: {
              appointmentId: appointment.id,
              eventId,
              requesterId,
            },
          },
        })
        console.log("Notification created for exhibitor")
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError)
        // Continue even if notification fails
      }

      return NextResponse.json({
        success: true,
        appointment,
        message: "Appointment request sent successfully!",
      })

    } catch (dbError: any) {
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      })
      
      // Handle specific Prisma errors
      if (dbError.code === 'P2002') {
        return NextResponse.json({ 
          error: "A duplicate appointment already exists" 
        }, { status: 409 })
      }
      
      if (dbError.code === 'P2025') {
        return NextResponse.json({ 
          error: "Referenced record not found" 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: "Failed to create appointment",
        details: dbError.message 
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, status, notes, confirmedDate, confirmedTime, outcome, cancellationReason } = body

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    // Check if appointment exists and user has permission to update it
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        requester: { select: { id: true } },
        exhibitor: { select: { id: true } }
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if user has permission to update this appointment
    const canUpdate = existingAppointment.requesterId === session.user.id || 
                     existingAppointment.exhibitorId === session.user.id

    if (!canUpdate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (outcome) updateData.outcome = outcome
    if (cancellationReason) updateData.cancellationReason = cancellationReason
    if (confirmedDate) updateData.confirmedDate = new Date(confirmedDate)
    if (confirmedTime) updateData.confirmedTime = confirmedTime

    // Handle status-specific updates
    if (status === "CANCELLED") {
      updateData.cancelledBy = session.user.id
      updateData.cancelledAt = new Date()
    }

    try {
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
        include: {
          requester: true,
          exhibitor: true,
          // title: true,
        },
      })

      // Create notifications based on status change
      try {
        if (status === "CONFIRMED") {
          await prisma.notification.create({
            data: {
              userId: appointment.requesterId,
              type: "APPOINTMENT_CONFIRMED",
              title: "Meeting Confirmed",
              message: `Your meeting "${appointment.title}" has been confirmed`,
              metadata: { appointmentId: appointment.id },
            },
          })
        } else if (status === "CANCELLED") {
          const notificationUserId =
            session.user.id === appointment.requesterId ? appointment.exhibitorId : appointment.requesterId

          await prisma.notification.create({
            data: {
              userId: notificationUserId,
              type: "APPOINTMENT_CANCELLED",
              title: "Meeting Cancelled",
              message: `The meeting "${appointment.title}" has been cancelled`,
              metadata: { appointmentId: appointment.id },
            },
          })
        }
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError)
        // Continue even if notification fails
      }

      return NextResponse.json({
        success: true,
        appointment,
        message: "Appointment updated successfully!",
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}