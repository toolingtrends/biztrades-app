import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 })
    }

    const venueManager = await prisma.user.findFirst({
      where: {
        id,
        role: "VENUE_MANAGER",
      },
      include: {
        meetingSpaces: true,
        venueReviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!venueManager) {
      return NextResponse.json({ success: false, error: "Venue not found" }, { status: 404 })
    }

    const venue = {
      id: venueManager.id,
      venueName: venueManager.venueName || venueManager.company || "",
      logo: venueManager.avatar || "",
      contactPerson: `${venueManager.firstName} ${venueManager.lastName}`.trim(),
      email: venueManager.email,
      mobile: venueManager.phone || "",
      address: venueManager.venueAddress || "",
      city: venueManager.venueCity || "",
      state: venueManager.venueState || "",
      country: venueManager.venueCountry || "",
      website: venueManager.website || "",
      description: venueManager.venueDescription || venueManager.bio || "",
      maxCapacity: venueManager.maxCapacity || 0,
      minCapacity: venueManager.maxCapacity || 0,
      totalHalls: venueManager.totalHalls || 0,
      totalEvents: venueManager.totalEvents || 0,
      activeBookings: venueManager.activeBookings || 0,
      averageRating: venueManager.averageRating || 0,
      totalReviews: venueManager.totalReviews || 0,
      amenities: venueManager.amenities || [],
      meetingSpaces: venueManager.meetingSpaces || [],
      isVerified: venueManager.isVerified || false,
      venueImages: venueManager.venueImages || [],
    //   mapUrl: venueManager.mapUrl || "",
    //   managerName: venueManager.managerName || "",
    //   managerPhone: venueManager.managerPhone || "",
    //   emergencyExits: venueManager.emergencyExits || 0,
    //   safetyInfo: venueManager.safetyInfo || "",
      safetyCertifications: venueManager.certifications || [],
      status: venueManager.isActive ? "active" : "suspended",
      createdAt: venueManager.createdAt.toISOString(),
      updatedAt: venueManager.updatedAt.toISOString(),
      reviews: venueManager.venueReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name: `${review.user.firstName} ${review.user.lastName}`.trim(),
          avatar: review.user.avatar || "/placeholder.svg",
        },
      })),
    }

    return NextResponse.json({ success: true, venue })
  } catch (error) {
    console.error("Error fetching venue:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 })
    }

    const body = await req.json()
    const {
      venueName,
      contactPerson,
      email,
      mobile,
      address,
      city,
      state,
      country,
      website,
      description,
      maxCapacity,
      minCapacity,
      totalHalls,
      amenities,
      isVerified,
      status,
      logo,
      venueImages,
      mapUrl,
      managerName,
      managerPhone,
      emergencyExits,
      safetyInfo,
      safetyCertifications,
    } = body

    // Split contactPerson into first/last name
    let firstName = ""
    let lastName = ""
    if (contactPerson) {
      const parts = contactPerson.split(" ")
      firstName = parts[0] || ""
      lastName = parts.slice(1).join(" ") || ""
    }

    const updatedVenue = await prisma.user.update({
      where: { id },
      data: {
        venueName,
        company: venueName,
        firstName,
        lastName,
        email,
        phone: mobile,
        venueAddress: address,
        venueCity: city,
        venueState: state,
        venueCountry: country,
        website,
        venueDescription: description,
        bio: description,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
        // minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
        totalHalls: totalHalls ? parseInt(totalHalls) : undefined,
        amenities: amenities || undefined,
        isVerified,
        isActive: status === "active",
        avatar: logo || undefined,
        venueImages: venueImages || undefined,
        // mapUrl: mapUrl || undefined,
        // managerName: managerName || undefined,
        // managerPhone: managerPhone || undefined,
        // emergencyExits: emergencyExits ? parseInt(emergencyExits) : undefined,
        // safetyInfo: safetyInfo || undefined,
        // safetyCertifications: safetyCertifications || undefined,
      },
      include: {
        meetingSpaces: true,
      },
    })

    return NextResponse.json({
      success: true,
      venue: {
        id: updatedVenue.id,
        venueName: updatedVenue.venueName,
        contactPerson: `${updatedVenue.firstName} ${updatedVenue.lastName}`.trim(),
        email: updatedVenue.email,
        mobile: updatedVenue.phone,
        address: updatedVenue.venueAddress,
        city: updatedVenue.venueCity,
        state: updatedVenue.venueState,
        country: updatedVenue.venueCountry,
        website: updatedVenue.website,
        description: updatedVenue.venueDescription,
        maxCapacity: updatedVenue.maxCapacity,
        minCapacity: updatedVenue.maxCapacity,
        totalHalls: updatedVenue.totalHalls,
        amenities: updatedVenue.amenities,
        isVerified: updatedVenue.isVerified,
        logo: updatedVenue.avatar,
        venueImages: updatedVenue.venueImages,
        // mapUrl: updatedVenue.mapUrl,
        // managerName: updatedVenue.managerName,
        // managerPhone: updatedVenue.managerPhone,
        // emergencyExits: updatedVenue.emergencyExits,
        // safetyInfo: updatedVenue.safetyInfo,
        safetyCertifications: updatedVenue.certifications,
        status: updatedVenue.isActive ? "active" : "suspended",
        // meetingSpaces: updatedVenue.meetingSpaces,
      },
    })
  } catch (error) {
    console.error("Error updating venue:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 })
    }

    // Instead of deleting, we can deactivate the venue
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ success: true, message: "Venue deactivated successfully" })
  } catch (error) {
    console.error("Error deleting venue:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}