import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET speaker details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.$connect()

    const speaker = await prisma.user.findUnique({
      where: {
        id,
        role: "SPEAKER",
      },
      include: {
        speakerSessions: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                bannerImage: true,
              },
            },
            materials: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                uploadedAt: true,
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
        },
        reviews: {
          where: {
            eventId: { not: null },
          },
          include: {
            event: {
              select: {
                title: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!speaker) {
      return NextResponse.json(
        { success: false, error: "Speaker not found" },
        { status: 404 }
      )
    }

    // Transform data for detailed view
    const totalSessions = speaker.speakerSessions.length
    const upcomingSessions = speaker.speakerSessions.filter(
      session => new Date(session.startTime) > new Date()
    ).length
    const completedSessions = speaker.speakerSessions.filter(
      session => session.status === "COMPLETED"
    ).length

    // Calculate average rating from reviews
    const averageRating = speaker.reviews.length > 0 
      ? speaker.reviews.reduce((sum, review) => sum + review.rating, 0) / speaker.reviews.length
      : speaker.averageRating

    const speakerDetails = {
      id: speaker.id,
      name: `${speaker.firstName} ${speaker.lastName}`,
      email: speaker.email,
      phone: speaker.phone,
      avatar: speaker.avatar,
      title: speaker.jobTitle,
      company: speaker.company,
      location: speaker.location,
      expertise: speaker.specialties || [],
      bio: speaker.bio,
      rating: averageRating,
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalEarnings: speaker.totalRevenue,
      status: speaker.isActive ? "active" : "inactive",
      verified: speaker.isVerified,
      joinedDate: speaker.createdAt.toISOString().split('T')[0],
      website: speaker.website,
      socialMedia: {
        linkedin: speaker.linkedin,
        twitter: speaker.twitter,
      },
      speakingFee: 0, // Add to schema if needed
      availability: "available", // Add to schema if needed
      languages: ["English"], // Add to schema if needed
      experience: speaker.speakingExperience,
      lastLogin: speaker.lastLogin,
      createdAt: speaker.createdAt,
      updatedAt: speaker.updatedAt,
    }

    // Session data for tabs
    const sessions = speaker.speakerSessions.map(session => ({
      id: session.id,
      title: session.title,
      event: session.event.title,
      date: session.startTime.toISOString().split('T')[0],
      time: `${session.startTime.toLocaleTimeString()} - ${session.endTime.toLocaleTimeString()}`,
      status: session.status,
      type: session.sessionType,
      materials: session.materials.length,
      rating: session.averageRating,
    }))

    // Earnings data (you might want to create a separate payments table)
    const earnings = [
      {
        id: "1",
        description: "Payment for AI Summit Session",
        date: "2024-03-20",
        amount: 5000,
        status: "paid",
      },
      // Add real payment data from your schema
    ]

    // Reviews data
    const reviews = speaker.reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      author: `${review.user.firstName} ${review.user.lastName}`,
      company: review.user.company,
      event: review.event?.title,
      date: review.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({
      success: true,
      speaker: speakerDetails,
      sessions,
      earnings,
      reviews,
    })
  } catch (error) {
    console.error("Error fetching speaker details:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - update speaker (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    await prisma.$connect()

    const existingSpeaker = await prisma.user.findUnique({
      where: { id, role: "SPEAKER" },
    })

    if (!existingSpeaker) {
      return NextResponse.json(
        { success: false, error: "Speaker not found" },
        { status: 404 }
      )
    }

    const updateData: any = {
      firstName: body.firstName || existingSpeaker.firstName,
      lastName: body.lastName || existingSpeaker.lastName,
      email: body.email || existingSpeaker.email,
      phone: body.phone || existingSpeaker.phone,
      bio: body.bio || existingSpeaker.bio,
      company: body.company || existingSpeaker.company,
      jobTitle: body.jobTitle || existingSpeaker.jobTitle,
      location: body.location || existingSpeaker.location,
      website: body.website || existingSpeaker.website,
      linkedin: body.linkedin || existingSpeaker.linkedin,
      twitter: body.twitter || existingSpeaker.twitter,
      specialties: body.specialties || existingSpeaker.specialties,
      speakingExperience: body.speakingExperience || existingSpeaker.speakingExperience,
      avatar: body.avatar !== undefined ? body.avatar : existingSpeaker.avatar,
      isVerified: body.verified !== undefined ? body.verified : existingSpeaker.isVerified,
      isActive: body.status === "active" ? true : body.status === "inactive" ? false : existingSpeaker.isActive,
    }

    const updatedSpeaker = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      speaker: {
        id: updatedSpeaker.id,
        name: `${updatedSpeaker.firstName} ${updatedSpeaker.lastName}`,
        email: updatedSpeaker.email,
        status: updatedSpeaker.isActive ? "active" : "inactive",
        verified: updatedSpeaker.isVerified,
      },
      message: "Speaker updated successfully",
    })
  } catch (error) {
    console.error("Error updating speaker:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
//PATCH -Update one item inspeaker(admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { isActive, isVerified } = body;

    // Validate that at least one field is provided
    if (isActive === undefined && isVerified === undefined) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const existingSpeaker = await prisma.user.findUnique({
      where: { id, role: "SPEAKER" },
    });

    if (!existingSpeaker) {
      return NextResponse.json(
        { success: false, error: "Speaker not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const updatedSpeaker = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      speaker: {
        id: updatedSpeaker.id,
        name: `${updatedSpeaker.firstName} ${updatedSpeaker.lastName}`,
        email: updatedSpeaker.email,
        status: updatedSpeaker.isActive ? "active" : "inactive",
        verified: updatedSpeaker.isVerified,
      },
      message: "Speaker updated successfully",
    });
  } catch (error) {
    console.error("Error updating speaker:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - remove speaker
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.$connect()

    const existingSpeaker = await prisma.user.findUnique({
      where: { id, role: "SPEAKER" },
    })

    if (!existingSpeaker) {
      return NextResponse.json(
        { success: false, error: "Speaker not found" },
        { status: 404 }
      )
    }

    // Instead of deleting, we can deactivate the speaker
    // Or if you want to hard delete, you'll need to handle relationships
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: "Speaker deactivated successfully",
    })
  } catch (error) {
    console.error("Error deleting speaker:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}