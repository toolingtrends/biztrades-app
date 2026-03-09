// app/api/admin/exhibitor/exhibitor-feedback/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // First fetch reviews where organizerId exists
    const reviews = await prisma.review.findMany({
      where: {
        organizerId: { not: null },    // organizer feedback
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const feedbacksWithDetails = await Promise.all(
      reviews.map(async (review) => {
        let organizerDetails = null
        let exhibitorDetails = null
        let eventDetails = null

        // Fetch organizer details (main profile)
        try {
          if (review.organizerId) {
            organizerDetails = await prisma.user.findUnique({
              where: { id: review.organizerId },
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
          console.warn(`Error fetching organizer ${review.organizerId} for review ${review.id}:`, error)
        }

        // Fetch exhibitor details (review giver)
        try {
          if (review.userId) {
            exhibitorDetails = await prisma.user.findUnique({
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
          console.warn(`Error fetching exhibitor/user ${review.userId} for review ${review.id}:`, error)
        }

        // Fetch event details
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

        // organizer fallback
        const organizerData = organizerDetails
          ? {
              ...organizerDetails,
              name:
                `${organizerDetails.firstName || ""} ${organizerDetails.lastName || ""}`.trim() ||
                "Unknown Organizer",
            }
          : {
              id: review.organizerId || "unknown",
              firstName: "Unknown",
              lastName: "Organizer",
              email: "unknown@example.com",
              company: "Unknown Company",
              avatar: null,
              name: "Unknown Organizer",
            }

        // exhibitor fallback
        const exhibitorData = exhibitorDetails
          ? {
              ...exhibitorDetails,
              name:
                `${exhibitorDetails.firstName || ""} ${exhibitorDetails.lastName || ""}`.trim() ||
                "Unknown Exhibitor",
            }
          : {
              id: review.userId || "unknown",
              firstName: "Unknown",
              lastName: "Exhibitor",
              email: "unknown@example.com",
              avatar: null,
              name: "Unknown Exhibitor",
            }

        // event fallback
        const eventData = eventDetails
          ? eventDetails
          : {
              id: review.eventId || "unknown",
              title: "Unknown Event",
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

          organizer: organizerData, // main profile
          exhibitor: exhibitorData, // reviewer
          event: eventData,
        }
      })
    )

    return NextResponse.json(feedbacksWithDetails)
  } catch (error) {
    console.error("Error fetching organizer feedbacks:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch organizer feedbacks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
