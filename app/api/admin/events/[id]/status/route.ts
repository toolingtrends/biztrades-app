import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { PrismaClient } from "@prisma/client"
import { EventStatus } from "@prisma/client"

const prisma = new PrismaClient()

// ✅ PATCH Handler - Update event status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { eventId } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(EventStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      )
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        adminType: session.user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
        action: "EVENT_STATUS_UPDATED",
        resource: "EVENT",
        resourceId: eventId,
        details: {
          title: updatedEvent.title,
          previousStatus: existingEvent.status,
          newStatus: status
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: "Event status updated successfully",
      event: updatedEvent
    })
  } catch (error) {
    console.error("Error updating event status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}