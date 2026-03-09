import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Get all available venues for selection
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } =await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Get the event to access organizer info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get all venue managers (can be filtered by organizer's network if needed)
    const venues = await prisma.user.findMany({
      where: {
        role: "VENUE_MANAGER",
        isActive: true,
        OR: search
          ? [
              { venueName: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { venueCity: { contains: search, mode: "insensitive" } },
              { venueAddress: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
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
      orderBy: [{ averageRating: "desc" }, { venueName: "asc" }],
    })

    return NextResponse.json({
      venues,
      total: venues.length,
    })
  } catch (error) {
    console.error("Error fetching available venues:", error)
    return NextResponse.json({ error: "Failed to fetch available venues" }, { status: 500 })
  }
}
