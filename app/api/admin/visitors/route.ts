import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: "ATTENDEE"
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ]
    }

    // Status filter
    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    } else if (status === "verified") {
      where.isVerified = true
    } else if (status === "unverified") {
      where.isVerified = false
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    // Fetch visitors with related data
    const visitors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        company: true,
        jobTitle: true,
        location: true,
        bio: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // Include event registrations count
        registrations: {
          select: {
            id: true,
            status: true
          }
        },
        // Include connections count
        connectionsSent: {
          select: {
            id: true,
            status: true
          }
        },
        connectionsReceived: {
          select: {
            id: true,
            status: true
          }
        },
        // Include appointments count
        appointmentsRequested: {
          select: {
            id: true,
            status: true
          }
        },
        // Include saved events count
        savedEvents: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Transform data with computed fields
    const transformedVisitors = visitors.map(visitor => {
      const totalRegistrations = visitor.registrations.length
      const confirmedRegistrations = visitor.registrations.filter(r => r.status === "CONFIRMED").length
      
      const totalConnections = visitor.connectionsSent.length + visitor.connectionsReceived.length
      const acceptedConnections = [
        ...visitor.connectionsSent.filter(c => c.status === "ACCEPTED"),
        ...visitor.connectionsReceived.filter(c => c.status === "ACCEPTED")
      ].length

      const totalAppointments = visitor.appointmentsRequested.length
      const completedAppointments = visitor.appointmentsRequested.filter(a => a.status === "COMPLETED").length

      return {
        id: visitor.id,
        name: `${visitor.firstName} ${visitor.lastName}`,
        email: visitor.email,
        phone: visitor.phone,
        avatar: visitor.avatar,
        company: visitor.company,
        jobTitle: visitor.jobTitle,
        location: visitor.location,
        bio: visitor.bio,
        website: visitor.website,
        social: {
          linkedin: visitor.linkedin,
          twitter: visitor.twitter,
          instagram: visitor.instagram
        },
        isVerified: visitor.isVerified,
        isActive: visitor.isActive,
        lastLogin: visitor.lastLogin?.toISOString(),
        createdAt: visitor.createdAt.toISOString(),
        updatedAt: visitor.updatedAt.toISOString(),
        stats: {
          totalRegistrations,
          confirmedRegistrations,
          totalConnections,
          acceptedConnections,
          totalAppointments,
          completedAppointments,
          savedEvents: visitor.savedEvents.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        visitors: transformedVisitors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error("Error fetching visitors:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch visitors",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Optional: POST endpoint for creating visitors (if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const visitor = await prisma.user.create({
      data: {
        ...body,
        role: "ATTENDEE"
      }
    })

    return NextResponse.json({
      success: true,
      data: visitor
    })
  } catch (error) {
    console.error("Error creating visitor:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create visitor" 
      },
      { status: 500 }
    )
  }
}