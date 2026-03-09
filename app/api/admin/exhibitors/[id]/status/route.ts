import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

interface Params {
  id: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive, isVerified } = body

    // Check if exhibitor exists
    const existingExhibitor = await prisma.user.findFirst({
      where: {
        id,
        role: "EXHIBITOR",
      },
    })

    if (!existingExhibitor) {
      return NextResponse.json({ error: "Exhibitor not found" }, { status: 404 })
    }

    // Update status
    const updatedExhibitor = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isVerified !== undefined && { isVerified }),
      },
    })

    // Remove password from response
    const { password: _, ...exhibitorWithoutPassword } = updatedExhibitor

    return NextResponse.json({
      exhibitor: exhibitorWithoutPassword,
      message: "Exhibitor status updated successfully",
    })
  } catch (error) {
    console.error("Error updating exhibitor status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}