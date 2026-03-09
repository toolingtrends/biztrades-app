import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Check if current user follows the target user
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("currentUserId")

    if (!currentUserId) {
      return NextResponse.json({ error: "Current user ID is required" }, { status: 400 })
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId:(await params).userId,
        },
      },
    })

    return NextResponse.json({ isFollowing: !!follow })
  } catch (error) {
    console.error("[v0] Error checking follow status:", error)
    return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 })
  }
}

// POST - Follow a user
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const body = await request.json()
    const { currentUserId } = body

    if (!currentUserId) {
      return NextResponse.json({ error: "Current user ID is required" }, { status: 400 })
    }

    if (currentUserId === (await params).userId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: (await params).userId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 })
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId:(await params).userId,
      },
    })

    return NextResponse.json({ success: true, follow }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error following user:", error)
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("currentUserId")

    if (!currentUserId) {
      return NextResponse.json({ error: "Current user ID is required" }, { status: 400 })
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId:(await params).userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error unfollowing user:", error)
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
  }
}
