import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get pending venues (isVerified = false or status = pending)
    const pendingVenues = await prisma.user.findMany({
      where: { 
        role: "VENUE_MANAGER",
        OR: [
          { isVerified: false },
          { isActive: false }
        ]
      },
      include: { 
        meetingSpaces: true,
        venueReviews: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const venues = pendingVenues.map((manager) => ({
      id: manager.id,
      venueName: manager.venueName || manager.company || "",
      logo: manager.avatar || "",
      contactPerson: `${manager.firstName} ${manager.lastName}`.trim(),
      email: manager.email,
      mobile: manager.phone || "",
      address: manager.venueAddress || manager.location || "",
      city: manager.venueCity || "",
      state: manager.venueState || "",
      country: manager.venueCountry || "",
      website: manager.website || "",
      description: manager.venueDescription || manager.bio || "",
      maxCapacity: manager.maxCapacity || 0,
      totalHalls: manager.totalHalls || 0,
      totalEvents: manager.totalEvents || 0,
      activeBookings: manager.activeBookings || 0,
      averageRating: manager.averageRating || 0,
      totalReviews: manager.totalReviews || 0,
      amenities: manager.amenities || [],
      meetingSpaces: manager.meetingSpaces || [],
      isVerified: manager.isVerified || false,
      isActive: manager.isActive || false,
      venueImages: manager.venueImages || [],
      status: !manager.isActive ? "suspended" : manager.isVerified ? "active" : "pending",
      createdAt: manager.createdAt.toISOString(),
      updatedAt: manager.updatedAt.toISOString(),
    }))

    return NextResponse.json({ success: true, venues })
  } catch (error) {
    console.error("Error fetching pending venues:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { venueId, action, reason } = body // action: 'approve' or 'reject'

    if (!venueId || !action) {
      return NextResponse.json(
        { success: false, error: "Venue ID and action are required" },
        { status: 400 }
      )
    }

    const venue = await prisma.user.findFirst({
      where: {
        id: venueId,
        role: "VENUE_MANAGER"
      }
    })

    if (!venue) {
      return NextResponse.json(
        { success: false, error: "Venue not found" },
        { status: 404 }
      )
    }

    let updateData = {}
    
    if (action === 'approve') {
      updateData = {
        isVerified: true,
        isActive: true
      }
    } else if (action === 'reject') {
      updateData = {
        isVerified: false,
        isActive: false,
        rejectionReason: reason
      }
    }

    const updatedVenue = await prisma.user.update({
      where: { id: venueId },
      data: updateData,
      include: {
        meetingSpaces: true,
      }
    })

    // TODO: Send email notification to venue manager about the decision

    return NextResponse.json({
      success: true,
      message: `Venue ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      venue: {
        id: updatedVenue.id,
        venueName: updatedVenue.venueName,
        isVerified: updatedVenue.isVerified,
        isActive: updatedVenue.isActive,
        status: updatedVenue.isActive ? (updatedVenue.isVerified ? "active" : "pending") : "suspended"
      }
    })
  } catch (error) {
    console.error("Error processing venue approval:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}