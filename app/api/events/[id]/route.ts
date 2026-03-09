// app/api/events/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// UUID pattern (e.g. 1917ffcd-1626-433c-b34d-8dbade66b224)
function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
// Helper function to check if string is MongoDB ObjectId
function isObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Invalid event identifier" }, { status: 400 })
    }

    let event

    const include = {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          organizationName: true,
          company: true,
          description: true,
          phone: true,
          totalEvents: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
        },
      },
      venue: true,
      leads: true,
      ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" as const } },
      speakerSessions: {
        include: {
          speaker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
              company: true,
              jobTitle: true,
            },
          },
        },
        orderBy: { startTime: "asc" as const },
      },
      exhibitionSpaces: { where: { isAvailable: true } },
      _count: { select: { registrations: true, reviews: true } },
    }

    // Try by ID first (UUID or MongoDB ObjectId)
    if (prisma?.event && (isUuid(id) || isObjectId(id))) {
      event = await prisma.event.findUnique({
        where: { id },
        include,
      })
    }

    if (!event && prisma?.event) {
      // Search by slug or title
      event = await prisma.event.findFirst({
        where: {
          OR: [
            { slug: id }, // Exact slug match
            { 
              title: {
                equals: id.replace(/-/g, ' '), // Convert "ai-conference-2025" to "ai conference 2025"
                mode: 'insensitive'
              }
            }
          ]
        },
        include,
      })

      if (!event) {
        event = await prisma.event.findFirst({
          where: {
            title: { contains: id.replace(/-/g, ' '), mode: 'insensitive' },
          },
          include,
        })
      }
    }

    // Fallback: fetch from backend (e.g. PostgreSQL/Neon when Next.js Prisma not used)
    if (!event) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (res.ok) {
          const backendEvent = await res.json()
          const response = NextResponse.json(backendEvent)
          response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30")
          return response
        }
      } catch (e) {
        console.error("Backend event fetch failed:", e)
      }
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Generate or update slug if missing
    if (!event.slug) {
      const newSlug = generateSlug(event.title)
      // Update the event with slug (optional - you can remove if you don't want to update)
      try {
        await prisma.event.update({
          where: { id: event.id },
          data: { slug: newSlug }
        })
        event.slug = newSlug
      } catch (updateError) {
        console.error("Error updating event slug:", updateError)
      }
    }

    const availableTickets =
      event.ticketTypes?.reduce(
        (total: number, ticket: { quantity: number; sold: number }) => total + (ticket.quantity - ticket.sold),
        0,
      ) ?? 0

    const eventData = {
      ...event,
      title: event.title || "Untitled Event",
      description: event.description || event.shortDescription || "",
      availableTickets,
      isAvailable: availableTickets > 0 && new Date() < event.registrationEnd,
      registrationCount: event._count?.registrations ?? 0,
      reviewCount: event._count?.reviews ?? 0,
      layoutPlan: event.layoutPlan,
      // Ensure slug is always included
      slug: event.slug || generateSlug(event.title),
      metadata: {
        title: event.title,
        description: event.description || event.shortDescription,
        image: event.bannerImage || event.images?.[0] || null,
        tags: event.tags || [],
        category: event.category || "General",
      }
    }

    // Set cache headers
    const response = NextResponse.json(eventData)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30')
    
    return response
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}