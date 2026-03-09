import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

interface ConnectionWithUsers {
  id: string
  senderId: string
  receiverId: string
  message: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  acceptedAt: Date | null
  sender: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string | null
    company: string | null
    avatar: string | null
    role: string
    lastLogin: Date | null
  } | null
  receiver: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string | null
    company: string | null
    avatar: string | null
    role: string
    lastLogin: Date | null
  } | null
}

interface FormattedConnection {
  id: string
  firstName: string
  lastName: string
  jobTitle: string | null
  company: string | null
  avatar: string | null
  role: string
  lastLogin: Date | null
  status: string | undefined
  connectionId: string
  isOutgoing: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id

    if (
      session.user.id !== userId &&
      !["admin", "superadmin", "organizer"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const whereClause: any = {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }

    if (statusFilter) {
      whereClause.status = statusFilter
    } else {
      whereClause.status = { notIn: ["REJECTED", "BLOCKED"] }
    }

    const connections = await prisma.connection.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            company: true,
            avatar: true,
            role: true,
            lastLogin: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            company: true,
            avatar: true,
            role: true,
            lastLogin: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }) as ConnectionWithUsers[]

    const formattedConnections: FormattedConnection[] = connections
      .map((conn) => {

        // 👇 key change is here
        const otherUser = (conn.senderId === userId
          ? conn.receiver
          : conn.sender) as NonNullable<ConnectionWithUsers["sender"] | ConnectionWithUsers["receiver"]>
        
        if (!otherUser) return null
        
        const isSender = conn.senderId === userId

        let status
        if (conn.status === "ACCEPTED") status = "connected"
        else if (conn.status === "PENDING") status = isSender ? "pending" : "request_received"
        else if (conn.status === "REJECTED") status = "rejected"
        else if (conn.status === "BLOCKED") status = "blocked"

        return {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          jobTitle: otherUser.jobTitle,
          company: otherUser.company,
          avatar: otherUser.avatar,
          role: otherUser.role,
          lastLogin: otherUser.lastLogin,
          status,
          connectionId: conn.id,
          isOutgoing: isSender
        }
      })
      .filter((c): c is FormattedConnection => c !== null)

    return NextResponse.json({ connections: formattedConnections })
  } catch (error) {
    console.error("Error fetching connections:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id
    const { receiverId, message } = await request.json()

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      )
    }

    // check existing
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      }
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      )
    }

    // receiver exists?
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      )
    }

    // create connection
    const connection = await prisma.connection.create({
      data: {
        senderId: userId,
        receiverId,
        message,
        status: "PENDING"
      },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            company: true,
            avatar: true
          }
        }
      }
    })

    // ⚡️ MOST IMPORTANT FIX (receiver can be null in TypeScript type)
    const r = connection.receiver!

    // notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "CONNECTION_REQUEST",
        title: "New Connection Request",
        message: `${session.user.firstName} ${session.user.lastName} wants to connect with you`,
        channels: ["PUSH", "EMAIL"],
        metadata: {
          connectionId: connection.id,
          senderId: userId,
          senderName: `${session.user.firstName} ${session.user.lastName}`
        }
      }
    })

    return NextResponse.json({
      connection: {
        id: connection.id,
        firstName: r.firstName,
        lastName: r.lastName,
        jobTitle: r.jobTitle,
        company: r.company,
        avatar: r.avatar,
        status: "pending"
      }
    })
  } catch (error) {
    console.error("Error creating connection:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
