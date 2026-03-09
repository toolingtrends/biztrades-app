import { type NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const feedback = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
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
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { isApproved, isPublic } = body

    const feedback = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(isApproved !== undefined && { isApproved }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
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

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error updating feedback:", error)
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 })
  }
}
