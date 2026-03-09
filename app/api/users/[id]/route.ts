import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id

    // Users can only view their own profile unless they're admin (allow various role casings)
    const isAdmin = ["admin", "superadmin", "ADMIN", "SUPER_ADMIN", "SUB_ADMIN"].includes(String(session.user.role ?? ""))
    if (session.user.id !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if it's a hardcoded user
    const hardcodedUsers = {
      "admin-1": {
        id: "admin-1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isVerified: true,
        createdAt: new Date().toISOString(),
        jobTitle: "System Administrator",
        company: "EventPlatform Inc.",
        companyIndustry: "Technology", // Add this
        bio: "Managing the platform and ensuring smooth operations.",
        phone: "+1 (555) 123-4567",
        website: "https://eventplatform.com",
        location: {
          address: "123 Admin St",
          city: "San Francisco",
          state: "CA",
          country: "USA",
        },
        interests: ["Conference", "Automation", "IT & Technology"],
        _count: {
          eventsAttended: 25,
          eventsOrganized: 50,
          connections: 100,
        },
      },
      "organizer-1": {
        id: "organizer-1",
        email: "organizer@example.com",
        firstName: "Organizer",
        lastName: "User",
        role: "organizer",
        isVerified: true,
        createdAt: new Date().toISOString(),
        jobTitle: "Event Organizer",
        company: "Events Co.",
        companyIndustry: "Event Management", // Add this
        bio: "Passionate about creating memorable events and experiences.",
        phone: "+1 (555) 234-5678",
        website: "https://eventsco.com",
        location: {
          address: "456 Event Ave",
          city: "New York",
          state: "NY",
          country: "USA",
        },
        interests: ["Conference", "Education Training", "Business Services"],
        _count: {
          eventsAttended: 15,
          eventsOrganized: 30,
          connections: 75,
        },
      },
      "superadmin-1": {
        id: "superadmin-1",
        email: "mainadmin@example.com",
        firstName: "Super Admin",
        lastName: "User",
        role: "superadmin",
        isVerified: true,
        createdAt: new Date().toISOString(),
        jobTitle: "Super Administrator",
        company: "EventPlatform Inc.",
        companyIndustry: "Technology", // Add this
        bio: "Overseeing all platform operations and strategic decisions.",
        phone: "+1 (555) 345-6789",
        website: "https://eventplatform.com",
        location: {
          address: "789 Super St",
          city: "Los Angeles",
          state: "CA",
          country: "USA",
        },
        interests: ["Conference", "Banking & Finance", "IT & Technology", "Automation"],
        _count: {
          eventsAttended: 40,
          eventsOrganized: 100,
          connections: 200,
        },
      },
    }

    if (hardcodedUsers[userId as keyof typeof hardcodedUsers]) {
      return NextResponse.json({
        user: hardcodedUsers[userId as keyof typeof hardcodedUsers],
      })
    }

    // Try Prisma (local DB) when available
    if (prisma?.user) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            bio: true,
            website: true,
            linkedin: true,
            twitter: true,
            instagram: true,
            company: true,
            companyIndustry: true,
            jobTitle: true,
            location: true,
            interests: true,
            isVerified: true,
            createdAt: true,
            lastLogin: true,
            _count: { select: { reviews: true } },
          },
        })
        if (user) {
          const userData = {
            ...user,
            _count: { eventsAttended: 0, eventsOrganized: 0, connections: 0 },
          }
          return NextResponse.json({ user: userData })
        }
      } catch (_) {
        // Fall through to backend fetch
      }
    }

    // Fallback 1: exhibitor from backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/exhibitors/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        const exhibitor = data?.exhibitor
        if (exhibitor) {
          const userData = {
            ...exhibitor,
            totalEvents: exhibitor.totalEvents ?? 0,
            activeEvents: exhibitor.activeEvents ?? 0,
            totalLeads: exhibitor.totalLeads ?? 0,
            pendingLeads: exhibitor.pendingLeads ?? 0,
            profileViews: exhibitor.profileViews ?? 0,
            upcomingAppointments: exhibitor.upcomingAppointments ?? 0,
            _count: { eventsAttended: 0, eventsOrganized: 0, connections: 0 },
          }
          return NextResponse.json({ user: userData })
        }
      }
    } catch (backendError) {
      console.error("Backend exhibitor fetch failed:", backendError)
    }

    // Fallback 2: any user (e.g. visitor/attendee) from backend — server-to-server with internal secret
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      const secret = process.env.INTERNAL_API_SECRET
      if (secret) (headers as Record<string, string>)["X-Internal-Secret"] = secret
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, { method: "GET", headers })
      if (res.ok) {
        const data = await res.json()
        if (data?.user) return NextResponse.json({ user: data.user })
      }
      if (res.status === 404) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    } catch (e) {
      console.error("Backend user-by-id fetch failed:", e)
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id

    // Users can only update their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      avatar, // Added avatar field
      bio,
      website,
      linkedin,
      twitter,
      instagram,
      company,
      companyIndustry,
      jobTitle,
      location,
      interests,
    } = body

    // For hardcoded users, return success but don't actually update
    if (["admin-1", "organizer-1", "superadmin-1"].includes(userId)) {
      return NextResponse.json({
        user: {
          id: userId,
          firstName,
          lastName,
          phone,
          avatar, // Include avatar in response
          bio,
          website,
          linkedin,
          twitter,
          instagram,
          company,
          companyIndustry,
          jobTitle,
          location,
          interests,
        },
      })
    }

    const updateData: any = {
      firstName,
      lastName,
      phone,
      bio,
      website,
      linkedin,
      twitter,
      instagram,
      company,
      companyIndustry,
      jobTitle,
      location,
      interests,
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true, // Include avatar in select
        role: true,
        bio: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        company: true,
        companyIndustry: true,
        jobTitle: true,
        location: true,
        interests: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}