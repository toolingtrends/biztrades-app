import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendBadgeEmail } from "@/lib/email-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; attendeeId: string }> }) {
  try {
    // ✅ Await params before accessing (Next.js 15 requirement)
    const { id: eventId, attendeeId } = await params
    const body = await request.json()
    const { badgeDataUrl, email } = body

    console.log("[v0] Processing badge for:", email, "in event:", eventId)

    const attendeeLead = await prisma.eventLead.findUnique({
      where: { id: attendeeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!attendeeLead || !attendeeLead.user) {
      console.log("[v0] Attendee lead not found for ID:", attendeeId)
      return NextResponse.json({ error: "Attendee or event not found" }, { status: 404 })
    }

    const attendee = attendeeLead.user
    const event = attendeeLead.event
    const attendeeName = `${attendee.firstName} ${attendee.lastName}`
    const attendeeEmail = email || attendee.email || ""

    console.log("[v0] Found attendee:", attendeeName, "for event:", event.title)

    const badgeSent = await prisma.badgeSent.create({
      data: {
        eventId,
        attendeeId: attendee.id,
        email: attendeeEmail,
        badgeUrl: badgeDataUrl,
        status: "SENT",
      },
    })

    console.log("[v0] Badge record saved to database:", badgeSent.id)

    try {
      await sendBadgeEmail(attendeeEmail, badgeDataUrl, attendeeName, event.title)

      console.log("[v0] Badge email sent successfully to:", attendeeEmail)
    } catch (emailError) {
      console.error("[v0] Failed to send badge email:", emailError)

      await prisma.badgeSent.update({
        where: { id: badgeSent.id },
        data: { status: "FAILED" },
      })

      return NextResponse.json({ error: "Badge saved but email sending failed" }, { status: 500 })
    }

    // ✅ Return success response
    return NextResponse.json({
      message: "Badge created and sent successfully",
      eventId,
      attendeeId: attendee.id,
      email: attendeeEmail,
      badgeId: badgeSent.id,
    })
  } catch (error) {
    console.error("[v0] Error creating badge:", error)
    return NextResponse.json({ error: "Error creating badge" }, { status: 500 })
  }
}
