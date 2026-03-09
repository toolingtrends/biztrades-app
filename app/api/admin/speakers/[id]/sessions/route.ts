import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sessions = await prisma.speakerSession.findMany({
      where: { speakerId: id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            bannerImage: true,
            venue: true,
          },
        },
        materials: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    })

    const transformedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      event: session.event.title,
      eventId: session.event.id,
      date: session.startTime.toISOString().split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      type: session.sessionType,
      status: session.status,
      location: session.room,
      materials: session.materials,
      rating: session.averageRating,
      totalRatings: session.totalRatings,
    }))

    return NextResponse.json({
      success: true,
      sessions: transformedSessions,
    })
  } catch (error) {
    console.error("Error fetching speaker sessions:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}