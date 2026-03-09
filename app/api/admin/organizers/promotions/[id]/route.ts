import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, rejectionReason } = body

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "EXPIRED"]
    if (!validStatuses.includes(status)) {
      return Response.json({ error: "Invalid status value" }, { status: 400 })
    }

    // If rejecting, require a reason
    if (status === "REJECTED" && !rejectionReason) {
      return Response.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
            email: true,
          },
        },
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
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

    return Response.json({
      success: true,
      promotion: updatedPromotion,
      message: `Promotion ${status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error("Error updating promotion:", error)
    return Response.json({ error: "Failed to update promotion" }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
            email: true,
          },
        },
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
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

    if (!promotion) {
      return Response.json({ error: "Promotion not found" }, { status: 404 })
    }

    return Response.json({ promotion })
  } catch (error) {
    console.error("Error fetching promotion:", error)
    return Response.json({ error: "Failed to fetch promotion" }, { status: 500 })
  }
}
