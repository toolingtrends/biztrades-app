import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all conferences for an event
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const conferences = await prisma.conference.findMany({
      where: { eventId },
      include: {
        sessions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(conferences)
  } catch (error) {
    console.error("[v0] Error fetching conferences:", error)
    return NextResponse.json({ error: "Failed to fetch conferences" }, { status: 500 })
  }
}

// POST create a new conference with sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, date, day, theme, sessions } = body

    // Validate required fields
    if (!eventId || !date || !day || !theme) {
      return NextResponse.json({ error: "Missing required fields: eventId, date, day, theme" }, { status: 400 })
    }

    // Create conference with sessions in a transaction
    const conference = await prisma.conference.create({
      data: {
        eventId,
        date,
        day,
        theme,
        isPublished: false,
        sessions: {
          create: sessions.map((session: any, index: number) => ({
            time: session.time,
            title: session.title,
            description: session.description || null,
            speaker: session.speaker || null,
            type: session.type,
            order: index,
          })),
        },
      },
      include: {
        sessions: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(conference, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating conference:", error)
    return NextResponse.json({ error: "Failed to create conference" }, { status: 500 })
  }
}
