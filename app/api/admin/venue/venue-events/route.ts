import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch all venues (users with VENUE_MANAGER role)
    const venues = await prisma.user.findMany({
      where: {
        role: "VENUE_MANAGER",
        isActive: true,
      },
      include: {
        venueEvents: {
          include: {
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Transform data to match frontend expectations
    const venueEventsData = venues.map((venue) => {
      const now = new Date()
      const upcomingEvents = venue.venueEvents.filter(
        (event) => event.status === "PUBLISHED" && new Date(event.startDate) > now
      )
      const activeEvents = venue.venueEvents.filter(
        (event) => event.status === "PUBLISHED" && new Date(event.startDate) <= now && new Date(event.endDate) >= now
      )
      const completedEvents = venue.venueEvents.filter(
        (event) => event.status === "COMPLETED" || new Date(event.endDate) < now
      )

      return {
        id: venue.id,
        venueName: venue.venueName || `${venue.firstName} ${venue.lastName}`,
        venueId: venue.id,
        venueEmail: venue.email || "",
        venuePhone: venue.venuePhone || venue.phone || "",
        venueCity: venue.venueCity || "",
        totalEvents: venue.venueEvents.length,
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        activeEvents: activeEvents.length,
        totalRevenue: venue.totalRevenue || 0,
        averageRating: venue.averageRating || 0,
        events: venue.venueEvents.map((event) => ({
          id: event.id,
          title: event.title,
          status: event.status,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          category: event.category,
          attendees: event.currentAttendees,
          organizerName: `${event.organizer.firstName} ${event.organizer.lastName}`,
          organizerEmail: event.organizer.email || "",
        })),
      }
    })

    return NextResponse.json(venueEventsData)
  } catch (error) {
    console.error("Error fetching venue events:", error)
    return NextResponse.json({ error: "Failed to fetch venue events" }, { status: 500 })
  }
}
