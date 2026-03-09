import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sessions = await prisma.speakerSession.findMany({
      where: {
        speakerId: id,
      },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            startDate: true,
            endDate: true,
          },
        },
        materials: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Error fetching speaker sessions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
