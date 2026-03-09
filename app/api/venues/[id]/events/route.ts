import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 })
    }

    const events = await prisma.event.findMany({
      where: { venueId: id },
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
            avatar: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    // Transform the data for frontend
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      status: event.status,
      category: event.category,
      images: event.images,
      bannerImage: event.bannerImage,
      venueId: event.venueId,
      organizerId: event.organizerId,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      currency: event.currency,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      averageRating: event.averageRating,
      eventType: event.eventType,
      totalReviews: event.totalReviews,
      ticketTypes: true,
      organizer: event.organizer ? {
        name: `${event.organizer.firstName} ${event.organizer.lastName}`,
        organization: event.organizer.company || 'Unknown Organization',
        avatar: event.organizer.avatar,
      } : undefined,
    }))

    return NextResponse.json({ 
      success: true, 
      events: transformedEvents 
    })
  } catch (error) {
    console.error("Error fetching events by venue ID:", error)
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 })
  }
}