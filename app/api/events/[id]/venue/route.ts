import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Get venue for a specific event
export async function GET(request: NextRequest, { params }: { params:Promise<{ eventId: string }> }) {
  try {
    const { eventId } =await params

    // Get the event with its venue
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            venueName: true,
            venueDescription: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
            venueZipCode: true,
            maxCapacity: true,
            totalHalls: true,
            averageRating: true,
            totalReviews: true,
            amenities: true,
            basePrice: true,
            venueImages: true,
            venuePhone: true,
            venueEmail: true,
            venueWebsite: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      venue: event.venue,
      eventId: event.id,
      eventTitle: event.title,
    })
  } catch (error) {
    console.error("Error fetching event venue:", error)
    return NextResponse.json({ error: "Failed to fetch event venue" }, { status: 500 })
  }
}

// PUT - Update venue for an event
export async function PUT(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } =await params
    const { venueId } = await request.json()

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Verify the venue exists and is a venue manager
    const venue = await prisma.user.findUnique({
      where: { id: venueId },
    })

    if (!venue || venue.role !== "VENUE_MANAGER") {
      return NextResponse.json({ error: "Invalid venue" }, { status: 400 })
    }

    // Update the event with the venue
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { venueId },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            venueName: true,
            venueDescription: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
            maxCapacity: true,
            totalHalls: true,
            averageRating: true,
            totalReviews: true,
            amenities: true,
            basePrice: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Venue updated successfully",
      event: updatedEvent,
    })
  } catch (error) {
    console.error("Error updating event venue:", error)
    return NextResponse.json({ error: "Failed to update event venue" }, { status: 500 })
  }
}

// DELETE - Remove venue from event
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } =await params

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { venueId: null },
    })

    return NextResponse.json({
      message: "Venue removed successfully",
      event: updatedEvent,
    })
  } catch (error) {
    console.error("Error removing event venue:", error)
    return NextResponse.json({ error: "Failed to remove event venue" }, { status: 500 })
  }
}
