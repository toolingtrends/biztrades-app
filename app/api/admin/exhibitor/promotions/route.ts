import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
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
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(promotions)
  } catch (error) {
    console.error("[EXHIBITOR_PROMOTIONS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch exhibitor promotions" }, { status: 500 })
  }
}
