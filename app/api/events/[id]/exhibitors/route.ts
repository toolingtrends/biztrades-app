import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status")

    console.log("Fetching attendees for event:", eventId)

    // ✅ validate status

    const attendeeLeads = await prisma.eventLead.findMany({
      where: {
        eventId,
        type: "EXHIBITOR",
      },
      include: {
        user: true,
        event: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, attendeeLeads })
  } catch (error) {
    console.error("Error fetching event attendees:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch attendees" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const { userId, notes } = await req.json()

    console.log("Creating attendee for event:", eventId, "user:", userId) // Debug log

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Create or update attendee lead for this specific event
    const lead = await prisma.eventLead.upsert({
      where: {
        eventId_userId_type: {
          eventId: eventId,
          userId: userId,
          type: "EXHIBITOR",
        },
      },
      update: {
        notes,
        updatedAt: new Date(),
      },
      create: {
        eventId: eventId,
        userId: userId,
        type: "EXHIBITOR",
        status: "NEW",
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            avatar: true,
          },
        },
        event: {
          select: { id: true, title: true, startDate: true },
        },
      },
    })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error("Error creating attendee lead:", error)
    return NextResponse.json({ success: false, error: "Failed to create attendee" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const { leadId, status, notes, followUpDate, contactedAt } = await req.json()

    console.log("Updating attendee for event:", eventId, "lead:", leadId) // Debug log

    // Verify the lead belongs to this event
    const lead = await prisma.eventLead.findFirst({
      where: {
        id: leadId,
        eventId: eventId, // Ensure the lead belongs to this event
      },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found or not authorized for this event" },
        { status: 404 },
      )
    }

    const updatedLead = await prisma.eventLead.update({
      where: { id: leadId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(followUpDate && { followUpDate: new Date(followUpDate) }),
        ...(contactedAt && { contactedAt: new Date(contactedAt) }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            avatar: true,
          },
        },
        event: {
          select: { id: true, title: true, startDate: true },
        },
      },
    })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error("Error updating exhibit lead:", error)
    return NextResponse.json({ success: false, error: "Failed to update attendee" }, { status: 500 })
  }
}
