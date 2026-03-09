import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get all manuals for the event
    const manuals = await prisma.exhibitorManual.findMany({
      where: {
        eventId,
        isActive: true,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: manuals,
    })
  } catch (error) {
    console.error("[v0] List error:", error)
    return NextResponse.json(
      { error: "Failed to fetch manuals", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
