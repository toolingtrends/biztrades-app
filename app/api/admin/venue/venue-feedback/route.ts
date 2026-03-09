import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch venue feedback through events that have venues and their reviews
    const eventsWithVenues = await prisma.event.findMany({
      where: {
        venueId: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        venueId: true,
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            venueAddress: true,
            avatar: true,
          },
        },
      },
    })

    // Fetch all reviews for these events
    const eventIds = eventsWithVenues.map(event => event.id)
    const reviews = await prisma.review.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Create a map for quick venue lookup
    const venueMap = new Map()
    eventsWithVenues.forEach(event => {
      if (event.venue) {
        venueMap.set(event.venue.id, event.venue)
      }
    })

    // Transform the data to create venue feedback list
    const feedback = reviews.map((review) => {
      const event = eventsWithVenues.find(e => e.id === review.eventId)
      const venue = event?.venue
      
      // Handle cases where user might be null
      const userName = review.user ? 
        `${review.user.firstName} ${review.user.lastName}` : 
        "Anonymous User"
      
      const userEmail = review.user?.email || "No email"

      return {
        id: review.id,
        venueId: venue?.id || "",
        venueName: venue ? `${venue.firstName} ${venue.lastName}` : "Unknown Venue",
        venueEmail: venue?.email || "",
        venueAddress: venue?.venueAddress || null,
        avatar: venue?.avatar || null,
        userName: userName,
        userEmail: userEmail,
        eventName: event?.title || null,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isApproved: review.isApproved,
        createdAt: review.createdAt.toISOString(),
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Calculate statistics
    const stats = {
      totalFeedback: feedback.length,
      pendingReviews: feedback.filter((f) => !f.isApproved).length,
      approvedFeedback: feedback.filter((f) => f.isApproved).length,
      averageRating: feedback.length > 0 ? 
        Number((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)) : 0,
    }

    return NextResponse.json({
      feedback,
      stats,
    })
  } catch (error) {
    console.error("Error fetching venue feedback:", error)
    return NextResponse.json({ error: "Failed to fetch venue feedback" }, { status: 500 })
  }
}