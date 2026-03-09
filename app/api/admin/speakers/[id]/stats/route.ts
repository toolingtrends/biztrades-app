import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [sessions, reviews, speaker] = await Promise.all([
      // Get session statistics
      prisma.speakerSession.findMany({
        where: { speakerId: id },
        select: {
          id: true,
          status: true,
          startTime: true,
          averageRating: true,
        },
      }),

      // Get review statistics
      prisma.review.findMany({
        where: {
          event: {
            speakerSessions: {
              some: { speakerId: id },
            },
          },
        },
        select: {
          rating: true,
          createdAt: true,
        },
      }),

      // Get speaker basic info
      prisma.user.findUnique({
        where: { id },
        select: {
          totalEvents: true,
          totalRevenue: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
        },
      }),
    ])

    if (!speaker) {
      return NextResponse.json(
        { success: false, error: "Speaker not found" },
        { status: 404 }
      )
    }

    const totalSessions = sessions.length
    const upcomingSessions = sessions.filter(
      session => new Date(session.startTime) > new Date()
    ).length
    const completedSessions = sessions.filter(
      session => session.status === "COMPLETED"
    ).length

    // Calculate rating distribution
    const ratingDistribution = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating - 1]++
      }
    })

    // Monthly earnings (mock data - you'll need to implement based on your payment system)
    const monthlyEarnings = [
      { month: "Jan", earnings: 4500 },
      { month: "Feb", earnings: 5200 },
      { month: "Mar", earnings: 4800 },
      { month: "Apr", earnings: 6100 },
      { month: "May", earnings: 5500 },
      { month: "Jun", earnings: 7200 },
    ]

    const stats = {
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalEarnings: speaker.totalRevenue,
      averageRating: speaker.averageRating,
      totalReviews: speaker.totalReviews,
      ratingDistribution,
      monthlyEarnings,
      joinedDate: speaker.createdAt,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching speaker statistics:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}