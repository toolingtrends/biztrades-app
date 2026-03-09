import { NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"

    // Build where clause
    const where: any = {
      role: "ATTENDEE",
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ]
    }

    // Fetch visitors with their connections
    const visitors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        company: true,
        jobTitle: true,
        location: true,
        connectionsSent: {
          select: {
            id: true,
            senderId: true,
            receiverId: true,
            status: true,
            createdAt: true,
            acceptedAt: true,
          },
        },
        connectionsReceived: {
          select: {
            id: true,
            senderId: true,
            receiverId: true,
            status: true,
            createdAt: true,
            acceptedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data
    const transformedVisitors = visitors.map((visitor) => {
      const connectionsSent = visitor.connectionsSent || []
      const connectionsReceived = visitor.connectionsReceived || []
      
      const acceptedConnectionsSent = connectionsSent.filter(c => c.status === "ACCEPTED").length
      const acceptedConnectionsReceived = connectionsReceived.filter(c => c.status === "ACCEPTED").length
      const pendingRequestsSent = connectionsSent.filter(c => c.status === "PENDING").length
      const pendingRequestsReceived = connectionsReceived.filter(c => c.status === "PENDING").length
      const rejectedRequestsSent = connectionsSent.filter(c => c.status === "REJECTED").length
      const rejectedRequestsReceived = connectionsReceived.filter(c => c.status === "REJECTED").length

      return {
        id: visitor.id,
        name: `${visitor.firstName} ${visitor.lastName}`,
        email: visitor.email,
        avatar: visitor.avatar,
        company: visitor.company,
        jobTitle: visitor.jobTitle,
        location: visitor.location,
        totalConnections: connectionsSent.length + connectionsReceived.length,
        acceptedConnections: acceptedConnectionsSent + acceptedConnectionsReceived,
        pendingRequests: pendingRequestsSent + pendingRequestsReceived,
        rejectedRequests: rejectedRequestsSent + rejectedRequestsReceived,
        connectionsSent: connectionsSent.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
        })),
        connectionsReceived: connectionsReceived.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
        })),
      }
    })

    // Apply status filter after transformation
    let filteredVisitors = transformedVisitors
    if (status === "active") {
      filteredVisitors = transformedVisitors.filter(v => v.acceptedConnections > 0)
    } else if (status === "pending") {
      filteredVisitors = transformedVisitors.filter(v => v.pendingRequests > 0)
    }

    return NextResponse.json({
      success: true,
      visitors: filteredVisitors,
    })
  } catch (error) {
    console.error("Error fetching visitor connections:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch visitor connections" },
      { status: 500 }
    )
  }
}
