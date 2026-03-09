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

    // Users can only view their own messages unless they're admin
    if (session.user.id !== userId && session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Mock conversations data
    const mockConversations = [
      {
        id: "1",
        participant: {
          id: "user1",
          firstName: "John",
          lastName: "Doe",
          avatar: null,
        },
        lastMessage: {
          id: "msg1",
          content: "Hey, looking forward to the conference!",
          createdAt: new Date().toISOString(),
          sender: {
            id: "user1",
            firstName: "John",
            lastName: "Doe",
          },
          isRead: false,
        },
        unreadCount: 2,
      },
      {
        id: "2",
        participant: {
          id: "user2",
          firstName: "Jane",
          lastName: "Smith",
          avatar: null,
        },
        lastMessage: {
          id: "msg2",
          content: "Thanks for connecting!",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          sender: {
            id: "user2",
            firstName: "Jane",
            lastName: "Smith",
          },
          isRead: true,
        },
        unreadCount: 0,
      },
      {
        id: "3",
        participant: {
          id: "user3",
          firstName: "Mike",
          lastName: "Johnson",
          avatar: null,
        },
        lastMessage: {
          id: "msg3",
          content: "Great meeting you at the event!",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          sender: {
            id: "user3",
            firstName: "Mike",
            lastName: "Johnson",
          },
          isRead: true,
        },
        unreadCount: 0,
      },
    ]

    return NextResponse.json({ conversations: mockConversations })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
