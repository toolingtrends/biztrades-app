// app/api/admin/exhibitor/exhibitor-feedback/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First, get reviews without relations to avoid the error
    const reviews = await prisma.review.findMany({
      where: {
        exhibitorId: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Now fetch related data for each review individually with error handling
    const feedbacksWithDetails = await Promise.all(
      reviews.map(async (review) => {
        let exhibitorDetails = null
        let userDetails = null
        let eventDetails = null

        // Fetch exhibitor details with error handling
        try {
          if (review.exhibitorId) {
            exhibitorDetails = await prisma.user.findUnique({
              where: { id: review.exhibitorId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                avatar: true,
              },
            })
          }
        } catch (error) {
          console.warn(`Error fetching exhibitor ${review.exhibitorId} for review ${review.id}:`, error)
        }

        // Fetch user details with error handling
        try {
          if (review.userId) {
            userDetails = await prisma.user.findUnique({
              where: { id: review.userId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            })
          }
        } catch (error) {
          console.warn(`Error fetching user ${review.userId} for review ${review.id}:`, error)
        }

        // Fetch event details with error handling
        try {
          if (review.eventId) {
            eventDetails = await prisma.event.findUnique({
              where: { id: review.eventId },
              select: {
                id: true,
                title: true,
                thumbnailImage: true,
              },
            })
          }
        } catch (error) {
          console.warn(`Error fetching event ${review.eventId} for review ${review.id}:`, error)
        }

        // Build exhibitor data with fallbacks
        const exhibitorData = exhibitorDetails ? {
          id: exhibitorDetails.id,
          firstName: exhibitorDetails.firstName,
          lastName: exhibitorDetails.lastName,
          email: exhibitorDetails.email,
          company: exhibitorDetails.company,
          avatar: exhibitorDetails.avatar,
          name: `${exhibitorDetails.firstName || ''} ${exhibitorDetails.lastName || ''}`.trim() || 'Unknown Exhibitor',
        } : {
          id: review.exhibitorId || 'unknown',
          firstName: 'Unknown',
          lastName: 'Exhibitor',
          email: 'unknown@example.com',
          company: 'Unknown Company',
          avatar: null,
          name: 'Unknown Exhibitor',
        }

        // Build user data with fallbacks
        const userData = userDetails ? {
          id: userDetails.id,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          email: userDetails.email,
          avatar: userDetails.avatar,
          name: `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'Unknown User',
        } : {
          id: review.userId || 'unknown',
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@example.com',
          avatar: null,
          name: 'Unknown User',
        }

        // Build event data with fallbacks
        const eventData = eventDetails ? {
          id: eventDetails.id,
          title: eventDetails.title,
          thumbnailImage: eventDetails.thumbnailImage,
        } : {
          id: review.eventId || 'unknown',
          title: 'Unknown Event',
          thumbnailImage: null,
        }

        return {
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          isApproved: review.isApproved,
          isPublic: review.isPublic,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          exhibitor: exhibitorData,
          user: userData,
          event: eventData,
        }
      })
    )

    return NextResponse.json(feedbacksWithDetails)
  } catch (error) {
    console.error("Error fetching exhibitor feedbacks:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch exhibitor feedbacks",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}