import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id

    // Users can only view their own events unless they're admin
    if (session.user.id !== userId && session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Mock events data
    const mockEvents = [
      {
        id: "1",
        title: "Tech Conference 2024",
        startDate: "2024-03-15T09:00:00Z",
        endDate: "2024-03-17T18:00:00Z",
        venue: {
          name: "Convention Center",
          location: { city: "San Francisco" },
        },
        status: "confirmed",
        type: "conference",
        description: "Annual technology conference featuring the latest innovations",
        attendeeCount: 500,
      },
      {
        id: "2",
        title: "AI Summit",
        startDate: "2024-04-20T10:00:00Z",
        endDate: "2024-04-22T17:00:00Z",
        venue: {
          name: "Tech Hub",
          location: { city: "New York" },
        },
        status: "pending",
        type: "summit",
        description: "Exploring the future of artificial intelligence",
        attendeeCount: 300,
      },
      {
        id: "3",
        title: "Web Development Workshop",
        startDate: "2023-12-10T10:00:00Z",
        endDate: "2023-12-10T16:00:00Z",
        venue: {
          name: "Learning Center",
          location: { city: "Austin" },
        },
        status: "completed",
        type: "workshop",
        description: "Hands-on workshop for modern web development",
        attendeeCount: 50,
      },
      {
        id: "4",
        title: "Startup Pitch Competition",
        startDate: "2023-11-15T14:00:00Z",
        endDate: "2023-11-15T18:00:00Z",
        venue: {
          name: "Innovation Hub",
          location: { city: "Seattle" },
        },
        status: "completed",
        type: "competition",
        description: "Entrepreneurs pitch their innovative ideas",
        attendeeCount: 200,
      },
    ]

    return NextResponse.json({ events: mockEvents })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
