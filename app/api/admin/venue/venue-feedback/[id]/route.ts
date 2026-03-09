import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { action, reason } = body

    if (action === "approve") {
      const review = await prisma.review.update({
        where: { id },
        data: {
          isApproved: true,
        },
      })

      return NextResponse.json({
        message: "Venue feedback approved successfully",
        review,
      })
    } else if (action === "reject") {
      const review = await prisma.review.update({
        where: { id },
        data: {
          isApproved: false,
          isPublic: false,
        },
      })

      // Here you might want to store the rejection reason
      // You could create a separate table for moderation logs

      return NextResponse.json({
        message: "Venue feedback rejected successfully",
        review,
        reason,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating venue feedback:", error)
    return NextResponse.json({ error: "Failed to update venue feedback" }, { status: 500 })
  }
}