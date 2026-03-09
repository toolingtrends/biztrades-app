import { prisma } from "@/lib/prisma"



export async function GET(req: Request) {
  try {
    const promotions = await prisma.promotion.findMany({
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
      orderBy: { createdAt: "desc" },
    })

    // ✅ Normalize to always have a unified "owner" field
    const normalized = promotions.map((promo) => ({
      ...promo,
      owner: promo.organizer ?? promo.exhibitor ?? null, // one consistent field
    }))

    return Response.json({
      promotions: normalized,
      total: normalized.length,
    })
  } catch (error) {
    console.error("Error fetching promotions:", error)
    return Response.json({ error: "Failed to fetch promotions" }, { status: 500 })
  }
}

