import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: {
        id: params.id,
        exhibitorId: { not: null },
      },
      include: {
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 })
    }

    return NextResponse.json(promotion)
  } catch (error) {
    console.error("[EXHIBITOR_PROMOTION_GET]", error)
    return NextResponse.json({ error: "Failed to fetch promotion" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, rejectionReason } = body

    if (!status || !["APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "EXPIRED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    // If rejecting, you might want to store the rejection reason
    // Add a rejectionReason field to your Promotion model if needed
    if (status === "REJECTED" && rejectionReason) {
      // Store rejection reason in metadata or add field to model
      updateData.metadata = { rejectionReason }
    }

    const promotion = await prisma.promotion.update({
      where: {
        id: params.id,
        exhibitorId: { not: null },
      },
      data: updateData,
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
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(promotion)
  } catch (error) {
    console.error("[EXHIBITOR_PROMOTION_PATCH]", error)
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 })
  }
}
