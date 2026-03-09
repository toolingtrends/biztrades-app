import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const venueManagers = await prisma.user.findMany({
      where: { role: "VENUE_MANAGER" },
      include: { meetingSpaces: true },
    });

    const venues = venueManagers.map((manager) => ({
      id: manager.id,
      venueName: manager.company || "",
      logo: manager.avatar || "",
      contactPerson: `${manager.firstName} ${manager.lastName}`.trim(),
      email: manager.email,
      mobile: manager.phone || "",
      address: manager.location || manager.venueAddress || "",
      city:  manager.venueCity || "",
      state:  manager.venueState || "",
      country:  manager.venueCountry || "",
      // zipCode: manager.location || manager.venuePostalCode || "",
      website: manager.website || "",
      description: manager.bio || "",
      maxCapacity: manager.maxCapacity || 0,
      totalHalls: manager.totalHalls || 0,
      totalEvents: manager.totalEvents || 0,
      activeBookings: manager.activeBookings || 0,
      averageRating: manager.averageRating || 0,
      totalReviews: manager.totalReviews || 0,
      amenities: manager.amenities || [],
      meetingSpaces: manager.meetingSpaces || [],
      isVerified: true,
      venueImages: manager.venueImages || [],
    }));

    return NextResponse.json({ success: true, venues });
  } catch (error) {
    console.error("Error fetching venue managers:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

