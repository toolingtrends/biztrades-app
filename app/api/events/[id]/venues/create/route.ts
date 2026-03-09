import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// POST - Create a new venue and assign it to the event
export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } =await params
    const body = await request.json()

    const {
      // Manager Information
      firstName,
      lastName,
      email,
      phone,
      // Venue Information
      venueName,
      venueDescription,
      website,
      maxCapacity,
      totalHalls,
      basePrice,
      // Address Information
      venueAddress,
      city,
      state,
      country,
      postalCode,
      // Amenities
      amenities,
      // Meeting Spaces
      meetingSpaces,
    } = body

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if venue manager email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    // Create the venue manager and assign to organizer's network
    const newVenue = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        role: "VENUE_MANAGER",
        isActive: true,
        isVerified: false,
        // Venue Information
        venueName,
        venueDescription,
        venueWebsite: website,
        maxCapacity: maxCapacity ? Number.parseInt(maxCapacity) : null,
        totalHalls: totalHalls ? Number.parseInt(totalHalls) : null,
        basePrice: basePrice ? Number.parseFloat(basePrice) : null,
        // Address Information
        venueAddress,
        venueCity: city,
        venueState: state,
        venueCountry: country,
        venueZipCode: postalCode,
        // Amenities
        amenities: amenities || [],
        // Link to organizer
        organizerIdForVenueManager: event.organizerId,
      },
    })

    // Create meeting spaces if provided
    if (meetingSpaces && meetingSpaces.length > 0) {
      await prisma.meetingSpace.createMany({
        data: meetingSpaces
          .filter((space: any) => space.name.trim() !== "")
          .map((space: any) => ({
            userId: newVenue.id,
            name: space.name,
            capacity: space.capacity || 0,
            area: space.area || 0,
            hourlyRate: space.hourlyRate || 0,
            isAvailable: true,
          })),
      })
    }

    // Assign the venue to the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { venueId: newVenue.id },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            venueName: true,
            venueDescription: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
            maxCapacity: true,
            totalHalls: true,
            amenities: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Venue created and assigned successfully",
      venue: newVenue,
      event: updatedEvent,
    })
  } catch (error) {
    console.error("Error creating venue:", error)
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 })
  }
}
