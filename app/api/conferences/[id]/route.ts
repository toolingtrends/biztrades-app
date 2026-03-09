import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET a specific conference
export async function GET(request: NextRequest, { params }: { params:Promise< { id: string }> }) {
  try {
    const conference = await prisma.conference.findUnique({
      where: { id:(await params).id },
      include: {
        sessions: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!conference) {
      return NextResponse.json({ error: "Conference not found" }, { status: 404 })
    }

    return NextResponse.json(conference)
  } catch (error) {
    console.error("[v0] Error fetching conference:", error)
    return NextResponse.json({ error: "Failed to fetch conference" }, { status: 500 })
  }
}

// PUT update a conference
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { date, day, theme, sessions, isPublished } = body

    // Delete existing sessions and create new ones
    await prisma.conferenceSession.deleteMany({
      where: { conferenceId:(await params).id },
    })

    const conference = await prisma.conference.update({
      where: { id:(await params).id },
      data: {
        date,
        day,
        theme,
        isPublished: isPublished ?? undefined,
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

    return NextResponse.json(conference)
  } catch (error) {
    console.error("[v0] Error updating conference:", error)
    return NextResponse.json({ error: "Failed to update conference" }, { status: 500 })
  }
}

// DELETE a conference
export async function DELETE(request: NextRequest, { params }: { params:Promise<{ id: string }> }) {
  try {
    // Sessions will be deleted automatically due to cascade
    await prisma.conference.delete({
      where: { id:(await params).id },
    })

    return NextResponse.json({ message: "Conference deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting conference:", error)
    return NextResponse.json({ error: "Failed to delete conference" }, { status: 500 })
  }
}
