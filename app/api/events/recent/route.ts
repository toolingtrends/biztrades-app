// app/api/events/recent/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const currentDate = new Date()

    // Fetch upcoming and ongoing events
    const events = await prisma.event.findMany({
      where: {
        endDate: {
          gte: currentDate, // events that are ongoing or upcoming
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        venue: {   // 👈 include venue relation
          select: {
            venueName: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
      take: 6,
    })

    // Transform to match frontend Event interface
    const formattedEvents = events.map((event) => {
      // Extract pricing from ticketTypes if available
      // const generalTicket = event.ticketTypes?.find(
      //   (t) => t.name.toLowerCase() === "general"
      // )
      // const vipTicket = event.ticketTypes?.find(
      //   (t) => t.name.toLowerCase() === "vip"
      // )
      // const premiumTicket = event.ticketTypes?.find(
      //   (t) => t.name.toLowerCase() === "premium"
      // )

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.shortDescription || "",
        slug: event.slug,
        status: event.status,
        eventType: event.eventType || ["General"], // array
        tags: event.tags || [],
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        timezone: event.timezone,
        venue: event.venue?.venueName || "",   // ✅ now safe
        // address: event.address || "",
        // city: event.city || "",
        // country: event.country || "",
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink || null,

     
        // generalPrice: generalTicket?.price || 0,
        // vipPrice: vipTicket?.price || 0,
        // premiumPrice: premiumTicket?.price || 0,

        // Media
        bannerImage: event.bannerImage || null,
        thumbnailImage: event.thumbnailImage || null,
        images: event.images || [],

        // Organizer info
        organizer: event.organizer
          ? `${event.organizer.firstName} ${event.organizer.lastName}`.trim() ||
            event.organizer.company ||
            "Unknown Organizer"
          : "Unknown Organizer",

        // Count
        attendees: event._count.registrations,
      }
    })

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("Error fetching recent events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
