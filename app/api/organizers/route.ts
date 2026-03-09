import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Fetch all organizers with proper statistics
    const organizers = await prisma.user.findMany({
      where: { role: "ORGANIZER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        organizationName: true,
        description: true,
        headquarters: true,
        totalReviews: true,
        averageRating: true,
        founded: true,
        teamSize: true,
        specialties: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Get actual event counts instead of using _count
        organizedEvents: {
          where: { status: "PUBLISHED" },
          select: { id: true }
        },
      },
    })

    const organizersWithStats = await Promise.all(
      organizers.map(async (organizer) => {
        const eventIds = organizer.organizedEvents.map((e) => e.id)

        // Count confirmed registrations across all events
        const attendeeCount = await prisma.eventRegistration.count({
          where: { 
            eventId: { in: eventIds }, 
            status: "CONFIRMED" 
          },
        })

        // Calculate years of experience safely
        const foundedYear = organizer.founded ? parseInt(organizer.founded) : new Date().getFullYear()
        const yearsOfExperience = isNaN(foundedYear) ? 0 : new Date().getFullYear() - foundedYear

        // Calculate total revenue
        const revenueData = await prisma.eventRegistration.aggregate({
          where: { 
            eventId: { in: eventIds }, 
            status: "CONFIRMED" 
          },
          _sum: {
            totalAmount: true
          }
        })

        return {
          id: organizer.id,
          name: organizer.organizationName || `${organizer.firstName} ${organizer.lastName}`,
          company: organizer.organizationName || "",
          image: organizer.avatar || "/placeholder.svg?height=100&width=100&text=Org",
          avgRating: organizer.averageRating || 0,
          totalReviews: organizer.totalReviews || 0,
          headquarters: organizer.headquarters || organizer.location || "Not specified",
          reviewCount: organizer.totalReviews || 0,
          location: organizer.location || "Not specified",
          country: "India", // You might want to extract this from location
          category: organizer.specialties?.[0] || "General Events",
          eventsOrganized: organizer.organizedEvents.length,
          yearsOfExperience,
          specialties: organizer.specialties || ["Event Management"],
          description: organizer.description || organizer.bio || "No description provided",
          phone: organizer.phone || "Not provided",
          email: organizer.email,
          website: organizer.website || "",
          verified: organizer.isVerified || false,
          active: organizer.isActive || false,
          featured: false,
          totalAttendees: attendeeCount,
          totalRevenue: revenueData._sum.totalAmount || 0,
          successRate: organizer.organizedEvents.length > 0 ? 95 : 0, // You can calculate this based on actual data
          joinDate: organizer.createdAt.toISOString().split("T")[0],
          lastActive: organizer.updatedAt.toISOString().split("T")[0],
        }
      }),
    )

    return NextResponse.json({ 
      organizers: organizersWithStats,
      total: organizersWithStats.length 
    })
  } catch (error) {
    console.error("Error fetching organizers:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Handle both single organizer and array of organizers
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { error: "Request body must be a non-empty array of organizers" },
          { status: 400 }
        )
      }
      
      const createdOrganizers = []
      
      for (const org of body) {
        const {
          email,
          phone,
          website,
          location,
          name,
          description,
          headquarters,
          founded,
          teamSize,
          specialties,
          avatar,
          firstName,
          lastName,
        } = org

        // Validate required fields
        if (!email || !name) {
          console.warn(`Skipping organizer - missing email or name:`, org)
          continue
        }

        // Check if organizer already exists
        const existingOrganizer = await prisma.user.findUnique({
          where: { email }
        })

        if (existingOrganizer) {
          console.warn(`Organizer with email ${email} already exists`)
          continue
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'
        const hashedPassword = await bcrypt.hash(tempPassword, 12)

        try {
          const newOrganizer = await prisma.user.create({
            data: {
              firstName: firstName || name.split(' ')[0] || "",
              lastName: lastName || name.split(' ').slice(1).join(' ') || "",
              email,
              phone: phone || "",
              avatar: avatar || "/placeholder.svg?height=100&width=100&text=Org",
              website: website || "",
              location: location || "",
              organizationName: name,
              description: description || "",
              headquarters: headquarters || "",
              founded: founded || null,
              teamSize: teamSize || null,
              specialties: specialties || [],
              role: "ORGANIZER",
              isVerified: true, // Auto-verify when added via API
              isActive: true,
              password: hashedPassword,
              // Initialize statistics
              totalEvents: 0,
              activeEvents: 0,
              totalAttendees: 0,
              totalRevenue: 0,
            },
          })
          
          createdOrganizers.push({
            ...newOrganizer,
            tempPassword // Include temp password for reference
          })
        } catch (createError) {
          console.error(`Error creating organizer ${email}:`, createError)
          continue
        }
      }

      if (createdOrganizers.length === 0) {
        return NextResponse.json(
          { error: "No valid organizers were created. They might already exist or have invalid data." },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        organizers: createdOrganizers,
        message: `Successfully created ${createdOrganizers.length} organizer(s)`,
        totalCreated: createdOrganizers.length
      }, { status: 201 })

    } else {
      // Handle single organizer creation
      const {
        email,
        phone,
        website,
        location,
        name,
        description,
        headquarters,
        founded,
        teamSize,
        specialties,
        avatar,
        firstName,
        lastName,
      } = body

      // Validate required fields for single organizer
      if (!email || !name) {
        return NextResponse.json(
          { error: "Email and organization name are required" },
          { status: 400 }
        )
      }

      // Check if organizer already exists
      const existingOrganizer = await prisma.user.findUnique({
        where: { email }
      })

      if (existingOrganizer) {
        return NextResponse.json(
          { error: "Organizer with this email already exists" },
          { status: 409 }
        )
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      const newOrganizer = await prisma.user.create({
        data: {
          firstName: firstName || name.split(' ')[0] || "",
          lastName: lastName || name.split(' ').slice(1).join(' ') || "",
          email,
          phone: phone || "",
          avatar: avatar || "/placeholder.svg?height=100&width=100&text=Org",
          website: website || "",
          location: location || "",
          organizationName: name,
          description: description || "",
          headquarters: headquarters || "",
          founded: founded || null,
          teamSize: teamSize || null,
          specialties: specialties || [],
          role: "ORGANIZER",
          isVerified: true,
          isActive: true,
          password: hashedPassword,
          totalEvents: 0,
          activeEvents: 0,
          totalAttendees: 0,
          totalRevenue: 0,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          organizationName: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        }
      })

      return NextResponse.json({ 
        organizer: newOrganizer,
        tempPassword,
        message: "Organizer created successfully"
      }, { status: 201 })
    }

  } catch (error) {
    console.error("Error creating organizer:", error)
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}