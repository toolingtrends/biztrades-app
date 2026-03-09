import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// Proxy organizer-venues listing to backend /api/venues and return plain list
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""

    const query = new URLSearchParams()
    if (search) query.set("search", search)

    const res = await fetch(`${API_BASE_URL}/api/venues?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.error("[v0] Backend /api/venues error:", body)
      return NextResponse.json({ error: "Failed to fetch venues" }, { status: res.status })
    }

    const data = await res.json()
    const venues = data.data || data.venues || []

    return NextResponse.json(venues)
  } catch (error) {
    console.error("[v0] Error fetching venues:", error)
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 })
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organizerId, venueIds } = body

    console.log("[v0] Adding existing venues to organizer network")
    console.log("[v0] Organizer ID:", organizerId)
    console.log("[v0] Venue IDs:", venueIds)

    // Validate required fields
    if (!organizerId) {
      return NextResponse.json({ success: false, error: "Organizer ID is required" }, { status: 400 })
    }

    if (!venueIds || !Array.isArray(venueIds) || venueIds.length === 0) {
      return NextResponse.json({ success: false, error: "Venue IDs are required" }, { status: 400 })
    }

    // Verify organizer exists and is an ORGANIZER
    const organizer = await prisma.user.findFirst({
      where: {
        id: organizerId,
        role: "ORGANIZER",
      },
    })

    if (!organizer) {
      return NextResponse.json({ success: false, error: "Organizer not found" }, { status: 404 })
    }

    // Verify all venues exist and are VENUE_MANAGERs
    const venues = await prisma.user.findMany({
      where: {
        id: { in: venueIds },
        role: "VENUE_MANAGER",
      },
    })

    if (venues.length !== venueIds.length) {
      return NextResponse.json({ success: false, error: "Some venues not found or invalid" }, { status: 404 })
    }

    // Update venues to link them to the organizer
    const updatedVenues = await prisma.user.updateMany({
      where: {
        id: { in: venueIds },
        role: "VENUE_MANAGER",
      },
      data: {
        organizerIdForVenueManager: organizerId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `${updatedVenues.count} venue(s) added to organizer network`,
        data: { updatedCount: updatedVenues.count },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error adding venues to organizer network:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
