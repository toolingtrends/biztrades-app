import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? "")
    const isObjectId = (id?.length ?? 0) === 24 && /^[0-9a-fA-F]{24}$/.test(id ?? "")

    if (!id || (!isUuid && !isObjectId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    if (!prisma?.savedEvent) {
      return NextResponse.json({ followers: [], total: 0 })
    }

    const savedEvents = await prisma.savedEvent.findMany({
      where: {
        eventId: id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            company: true,
            jobTitle: true,
          }
        }
      },
      orderBy: {
        savedAt: 'desc'
      }
    })

    return NextResponse.json({
      followers: savedEvents,
      total: savedEvents.length
    })

  } catch (error) {
    console.error("Error fetching event followers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}