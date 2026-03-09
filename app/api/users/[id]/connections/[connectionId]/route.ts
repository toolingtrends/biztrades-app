import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; connectionId: string }> }
) {
  try {
    // Await the params promise
    const { id, connectionId } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = id
    const { action } = await request.json()

    if (!["accept", "reject", "cancel", "block"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get the connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: true,
        receiver: true
      }
    })

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Check if sender and receiver exist
    if (!connection.sender || !connection.receiver) {
      return NextResponse.json({ error: "Invalid connection data" }, { status: 400 })
    }

    // Check if user has permission to modify this connection
    if (connection.senderId !== userId && connection.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let updatedConnection
    let notificationUserId
    let notificationMessage

    switch (action) {
      case "accept":
        if (connection.receiverId !== userId) {
          return NextResponse.json({ error: "Only receiver can accept connection" }, { status: 403 })
        }
        
        updatedConnection = await prisma.connection.update({
          where: { id: connectionId },
          data: { 
            status: "ACCEPTED",
            acceptedAt: new Date()
          }
        })
        
        notificationUserId = connection.senderId
        notificationMessage = `${connection.receiver.firstName} ${connection.receiver.lastName} accepted your connection request`
        break
        
      case "reject":
        if (connection.receiverId !== userId) {
          return NextResponse.json({ error: "Only receiver can reject connection" }, { status: 403 })
        }
        
        updatedConnection = await prisma.connection.update({
          where: { id: connectionId },
          data: { status: "REJECTED" }
        })
        
        notificationUserId = connection.senderId
        notificationMessage = `${connection.receiver.firstName} ${connection.receiver.lastName} declined your connection request`
        break
        
      case "cancel":
        if (connection.senderId !== userId) {
          return NextResponse.json({ error: "Only sender can cancel connection" }, { status: 403 })
        }
        
        updatedConnection = await prisma.connection.update({
          where: { id: connectionId },
          data: { status: "REJECTED" }
        })
        
        notificationUserId = connection.receiverId
        notificationMessage = `${connection.sender.firstName} ${connection.sender.lastName} canceled their connection request`
        break
        
      case "block":
        updatedConnection = await prisma.connection.update({
          where: { id: connectionId },
          data: { status: "BLOCKED" }
        })
        
        notificationUserId = connection.senderId === userId ? connection.receiverId : connection.senderId
        notificationMessage = `${session.user.firstName} ${session.user.lastName} blocked you`
        break
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Create notification if needed
    if (notificationUserId && notificationMessage) {
      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          type: "CONNECTION_UPDATE",
          title: "Connection Update",
          message: notificationMessage,
          channels: ["PUSH"],
          metadata: {
            connectionId: connection.id,
            action: action
          }
        }
      })
    }

    return NextResponse.json({ 
      message: `Connection ${action}ed successfully`,
      connection: updatedConnection
    })
  } catch (error) {
    console.error("Error updating connection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}