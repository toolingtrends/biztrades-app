import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all speakers
export async function GET(request: NextRequest) {
  try {
    await prisma.$connect()

    const speakers = await prisma.user.findMany({
      where: {
        role: "SPEAKER",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        company: true,
        jobTitle: true,
        location: true,
        website: true,
        linkedin: true,
        twitter: true,
        specialties: true,
        achievements: true,
        certifications: true,
        speakingExperience: true,
        isVerified: true,
        totalEvents: true,
        activeEvents: true,
        totalAttendees: true,
        totalRevenue: true,
        averageRating: true,
        totalReviews: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      speakers,
    })
  } catch (error) {
    console.error("Error fetching speakers:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - create new speaker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      company,
      jobTitle,
      location,
      website,
      linkedin,
      twitter,
      specialties,
      achievements,
      certifications,
      speakingExperience,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and email are required" },
        { status: 400 }
      )
    }

    await prisma.$connect()

    // Check if speaker with email already exists
    const existingSpeaker = await prisma.user.findFirst({
      where: {
        email,
        role: "SPEAKER",
      },
    })

    if (existingSpeaker) {
      return NextResponse.json(
        { success: false, error: "Speaker with this email already exists" },
        { status: 409 }
      )
    }

    // Create new speaker
    const speaker = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || "",
        bio: bio || "",
        company: company || "",
        jobTitle: jobTitle || "",
        location: location || "",
        website: website || "",
        linkedin: linkedin || "",
        twitter: twitter || "",
        specialties: specialties || [],
        achievements: achievements || [],
        certifications: certifications || [],
        speakingExperience: speakingExperience || "",
        role: "SPEAKER",
        isVerified: false,
        totalEvents: 0,
        activeEvents: 0,
        totalAttendees: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
      },
    })

    return NextResponse.json({
      success: true,
      speaker,
      message: "Speaker created successfully",
    })
  } catch (error) {
    console.error("Error creating speaker:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}