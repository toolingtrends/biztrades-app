import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      phone,
      password = "TEMP_PASSWORD",
      bio,
      company,
      jobTitle,
      location,
      website,
      linkedin,
      twitter,
      instagram,
      avatar,
      specialties = [],
      achievements = [],
      certifications = [],
      speakingExperience,
      isVerified = false,
      isActive = true,
      timezone = "UTC",
      language = "en",
      interests = [],
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new speaker
    const speaker = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || "",
        password, // In production, hash this password
        bio: bio || "",
        company: company || "",
        jobTitle: jobTitle || "",
        location: location || "",
        website: website || "",
        linkedin: linkedin || "",
        twitter: twitter || "",
        instagram: instagram || "",
        avatar: avatar || "",
        specialties: specialties || [],
        achievements: achievements || [],
        certifications: certifications || [],
        speakingExperience: speakingExperience || "",
        role: "SPEAKER",
        isVerified,
        isActive,
        timezone,
        language,
        interests: interests || [],
        totalEvents: 0,
        activeEvents: 0,
        totalAttendees: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
      },
    });

    return NextResponse.json({
      success: true,
      speaker: {
        id: speaker.id,
        name: `${speaker.firstName} ${speaker.lastName}`,
        email: speaker.email,
        status: speaker.isActive ? "active" : "inactive",
        verified: speaker.isVerified,
      },
      message: "Speaker created successfully",
    });
  } catch (error) {
    console.error("Error creating speaker:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// app/api/speakers/route.ts - Update the GET response
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      role: "SPEAKER",
    };

    // Add status filter
    if (status !== "all") {
      where.isActive = status === "active";
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const [speakers, totalCount, totalSpeakers, activeSpeakers, pendingSpeakers, revenueData] = await Promise.all([
      prisma.user.findMany({
        where,
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
          isActive: true,
          totalEvents: true,
          activeEvents: true,
          totalAttendees: true,
          totalRevenue: true,
          averageRating: true,
          totalReviews: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          speakerSessions: {
            select: {
              id: true,
              status: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: "SPEAKER" } }),
      prisma.user.count({ where: { role: "SPEAKER", isActive: true } }),
      prisma.user.count({ where: { role: "SPEAKER", isVerified: false } }),
      prisma.user.aggregate({
        where: { role: "SPEAKER" },
        _sum: { totalRevenue: true },
      }),
    ]);

    // Transform data to match frontend expectations
    const transformedSpeakers = speakers.map(speaker => {
      const totalSessions = speaker.speakerSessions.length;
      const upcomingSessions = speaker.speakerSessions.filter(
        session => new Date(session.startTime) > new Date()
      ).length;
      const completedSessions = speaker.speakerSessions.filter(
        session => session.status === "COMPLETED"
      ).length;

      return {
        id: speaker.id,
        name: `${speaker.firstName} ${speaker.lastName}`,
        email: speaker.email,
        phone: speaker.phone || "",
        avatar: speaker.avatar || "/placeholder.svg",
        title: speaker.jobTitle || "",
        company: speaker.company || "",
        location: speaker.location || "",
        expertise: speaker.specialties || [],
        bio: speaker.bio || "",
        rating: speaker.averageRating || 0,
        totalSessions,
        upcomingSessions,
        completedSessions,
        totalEarnings: speaker.totalRevenue || 0,
        status: speaker.isActive ? "active" : "inactive",
        verified: speaker.isVerified || false,
        joinedDate: speaker.createdAt.toISOString().split('T')[0],
        website: speaker.website || "",
        socialMedia: {
          linkedin: speaker.linkedin || "",
          twitter: speaker.twitter || "",
        },
        speakingFee: 0, // You might want to add this to your schema
        availability: "available", // You might want to add this to your schema
        languages: ["English"], // You might want to add this to your schema
        experience: speaker.speakingExperience || "",
        lastLogin: speaker.lastLogin,
        createdAt: speaker.createdAt,
      };
    });

    const statistics = {
      totalSpeakers,
      activeSpeakers,
      pendingSpeakers,
      totalRevenue: revenueData._sum.totalRevenue || 0,
    };

    return NextResponse.json({
      success: true,
      speakers: transformedSpeakers,
      statistics, // Make sure this is included
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching speakers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}