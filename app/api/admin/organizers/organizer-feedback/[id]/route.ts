import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const feedback = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!feedback) {
      return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 })
    }

    // Transform data for frontend
    const transformedFeedback = {
      id: feedback.id,
      organizerId: feedback.organizerId,
      organizerName: feedback.organizer
        ? `${feedback.organizer.firstName} ${feedback.organizer.lastName}`
        : "Unknown Organizer",
      organizerEmail: feedback.organizer?.email || "",
      eventId: feedback.eventId,
      eventTitle: feedback.event?.title || null,
      userId: feedback.userId,
      userName: `${feedback.user.firstName} ${feedback.user.lastName}`,
      userEmail: feedback.user.email || "",
      rating: feedback.rating,
      title: feedback.title,
      comment: feedback.comment,
      isApproved: feedback.isApproved,
      isPublic: feedback.isPublic,
      createdAt: feedback.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      feedback: transformedFeedback,
    })
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action, reason } = body

    if (action === "approve") {
      await prisma.review.update({
        where: { id: params.id },
        data: {
          isApproved: true,
          isPublic: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Feedback approved successfully",
      })
    } else if (action === "reject") {
      await prisma.review.update({
        where: { id: params.id },
        data: {
          isApproved: false,
          isPublic: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Feedback rejected successfully",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 })
  }
}
