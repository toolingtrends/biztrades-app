import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch venue bookings from the database
    const venueBookings = await prisma.venueBooking.findMany({
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            venueName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    // Transform to booking format
    const bookings = venueBookings.map((booking, index) => ({
      id: booking.id,
      partnerId: booking.venueId,
      partnerName: booking.venue?.venueName || `${booking.venue?.firstName} ${booking.venue?.lastName}`,
      type: "Hotel",
      customerName: "Event Organizer",
      customerEmail: booking.venue?.email || "",
      bookingDate: booking.createdAt.toISOString(),
      checkIn: booking.startDate.toISOString(),
      checkOut: booking.endDate.toISOString(),
      amount: booking.totalAmount,
      commission: booking.totalAmount * 0.1,
      status: booking.status.toLowerCase(),
      reference: `TRV-${String(index + 1).padStart(6, "0")}`,
    }))

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching travel bookings:", error)
    return NextResponse.json({ bookings: [] })
  }
}
