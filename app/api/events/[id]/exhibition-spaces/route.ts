import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId } = await context.params

    if (!eventId || eventId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    // First try to get exhibition spaces directly from the event
    const exhibitionSpaces = await prisma.exhibitionSpace.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
    })

    if (exhibitionSpaces.length > 0) {
      const spaces = exhibitionSpaces.map((space) => ({
        id: space.id,
        name: space.name,
        spaceType: space.spaceType,
        dimensions: space.dimensions,
        area: space.area,
        basePrice: space.basePrice,
        location: space.location,
        isAvailable: space.isAvailable && space.bookedBooths < (space.maxBooths || 999),
        maxBooths: space.maxBooths,
        bookedBooths: space.bookedBooths,
      }))

      return NextResponse.json({ exhibitionSpaces: spaces })
    }

    // Fallback: try to get from venue meeting spaces
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: {
          include: {
            meetingSpaces: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Map meetingSpaces → exhibition spaces
    const spaces =
      event.venue?.meetingSpaces.map((space) => ({
        id: space.id,
        name: space.name,
        spaceType: "Exhibition",
        dimensions: `${Math.sqrt(space.area)} x ${Math.sqrt(space.area)} ft`,
        area: space.area,
        basePrice: space.hourlyRate * 8,
        isAvailable: space.isAvailable,
        maxBooths: Math.floor(space.area / 100), // Estimate booths based on area
        bookedBooths: 0,
      })) || []

    // Fallback mock spaces if no venue spaces exist
    if (spaces.length === 0) {
      spaces.push(
        {
          id: `${eventId}-space-1`,
          name: "Exhibition Hall A",
          spaceType: "Large Exhibition",
          dimensions: "50 x 30 ft",
          area: 1500,
          basePrice: 500,
          isAvailable: true,
          maxBooths: 15,
          bookedBooths: 0,
        },
        {
          id: `${eventId}-space-2`,
          name: "Exhibition Hall B",
          spaceType: "Medium Exhibition",
          dimensions: "30 x 20 ft",
          area: 600,
          basePrice: 300,
          isAvailable: true,
          maxBooths: 6,
          bookedBooths: 0,
        },
        {
          id: `${eventId}-space-3`,
          name: "Premium Booth",
          spaceType: "Premium Exhibition",
          dimensions: "20 x 15 ft",
          area: 300,
          basePrice: 800,
          isAvailable: false,
          maxBooths: 3,
          bookedBooths: 3,
        },
      )
    }

    return NextResponse.json({ exhibitionSpaces: spaces })
  } catch (error) {
    console.error("Error fetching exhibition spaces:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
