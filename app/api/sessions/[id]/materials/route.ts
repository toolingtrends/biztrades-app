import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch all materials for a specific session
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const materials = await prisma.material.findMany({
      where: {
        sessionId:(await params).id,
      },
      include: {
        speaker: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    })

    return NextResponse.json({ materials }, { status: 200 })
  } catch (error) {
    console.error("Error fetching session materials:", error)
    return NextResponse.json({ error: "Failed to fetch session materials" }, { status: 500 })
  }
}
