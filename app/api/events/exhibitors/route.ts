import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/events/exhibitors called")

    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("[v0] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[v0] Session found:", session.user?.email)

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const {
      eventId,
      exhibitorId,
      spaceId,
      boothNumber,
      companyName,
      description,
      additionalPower,
      compressedAir,
      setupRequirements,
      specialRequests,
      totalCost,
    } = body

    // Validate required fields
    if (!eventId || !exhibitorId || !spaceId || !boothNumber || !companyName) {
      console.log("[v0] Validation failed - missing fields:", {
        eventId: !!eventId,
        exhibitorId: !!exhibitorId,
        spaceId: !!spaceId,
        boothNumber: !!boothNumber,
        companyName: !!companyName,
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Checking for existing booth...")
    // Check if exhibitor is already registered for this event
    const existingBooth = await prisma.exhibitorBooth.findUnique({
      where: {
        eventId_exhibitorId: {
          eventId,
          exhibitorId,
        },
      },
    })

    if (existingBooth) {
      console.log("[v0] Exhibitor already registered for this event")
      return NextResponse.json(
        {
          error: "Exhibitor is already registered for this event",
        },
        { status: 409 },
      )
    }

    const generatedSpaceId = new ObjectId().toString()
    console.log("[v0] Generated spaceId:", generatedSpaceId, "from original:", spaceId)

    console.log("[v0] Creating exhibitor booth...")
    // Create exhibitor booth
    const booth = await prisma.exhibitorBooth.create({
      data: {
        eventId,
        exhibitorId,
        spaceId: generatedSpaceId, // Use generated ObjectID instead of the string spaceId
        boothNumber,
        companyName,
        description,
        additionalPower: Number.parseFloat(additionalPower) || 0,
        compressedAir: Number.parseFloat(compressedAir) || 0,
        setupRequirements: setupRequirements ? JSON.parse(JSON.stringify({ requirements: setupRequirements })) : null,
        specialRequests,
        totalCost: Number.parseFloat(totalCost) || 0,
        status: "BOOKED",
        spaceReference: spaceId, // Store the original space identifier for reference
      },
      include: {
        exhibitor: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    })

    console.log("[v0] Booth created successfully:", booth.id)

    // We'll handle space management differently or create proper ExhibitionSpace records
    console.log("[v0] Skipping exhibition space update - using generated spaceId")

    return NextResponse.json({ booth }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding exhibitor to event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



export async function GET(request: NextRequest) {
  try {
    console.log("[v1] GET /api/events/exhibitors called")

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const organizerId = searchParams.get("organizerId")

    if (!eventId && !organizerId) {
      console.log("[v1] Missing eventId or organizerId in query params")
      return NextResponse.json({ error: "eventId or organizerId is required" }, { status: 400 })
    }

    console.log("[v1] Fetching booths for:", eventId ? `eventId: ${eventId}` : `organizerId: ${organizerId}`)

    const booths = await prisma.exhibitorBooth.findMany({
      where: eventId
        ? { eventId }
        : organizerId
          ? {
              event: {
                organizerId: {
                  equals: organizerId,
                },
              },
            }
          : undefined,
      include: {
        exhibitor: {
          select: {
            id: true, // 👈 important
            
            firstName: true,
            lastName: true,
            company: true,
            email: true,
            phone: true,
            
            description: true,

             _count: {
              select: { appointmentsReceived: true },
             }
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            organizerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!booths || booths.length === 0) {
      return NextResponse.json({ message: "No exhibitor booths found", booths: [] }, { status: 200 })
    }

    // Clean response mapping
    const formattedBooths = booths.map((b) => ({
      id: b.exhibitor?.id || "", // exhibitor record id
      // userId: b.exhibitor?.userId || "", // 👈 used in meeting creation
      boothId: b.id,
      boothNumber: b.boothNumber,
      company: b.exhibitor?.company || "N/A",
      name: `${b.exhibitor?.firstName || ""} ${b.exhibitor?.lastName || ""}`.trim(),
      email: b.exhibitor?.email || "",
      phone: b.exhibitor?.phone || "",
      // logo: b.exhibitor?.logo || "",
      description: b.exhibitor?.description || "",
      // status: b.exhibitor?.status || "UNKNOWN",
      totalCost: b.totalCost || 0,
      totalAppointmentsReceived: b.exhibitor?._count?.appointmentsReceived || 0, // 👈 added here
      event: b.event,
    }))

    return NextResponse.json({ booths: formattedBooths }, { status: 200 })
  } catch (error) {
    console.error("[v1] Error fetching exhibitor booths:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

