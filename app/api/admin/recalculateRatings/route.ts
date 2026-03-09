// api/admin/recalculateRatings/route.ts
import { prisma } from "@/lib/prisma"

export async function GET() {
  const events = await prisma.event.findMany()

  for (const event of events) {
    const reviews = await prisma.review.findMany({
      where: { eventId: event.id },
      select: { rating: true },
    })

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
      const averageRating = totalRating / reviews.length

      await prisma.event.update({
        where: { id: event.id },
        data: {
          averageRating,
          totalReviews: reviews.length,
        },
      })
    }
  }

  return Response.json({ success: true })
}
