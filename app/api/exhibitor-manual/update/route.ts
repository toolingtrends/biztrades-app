import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const { id, description, version, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Manual ID is required" }, { status: 400 })
    }

    // Update the manual in database
    const updatedManual = await prisma.exhibitorManual.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(version !== undefined && { version }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedManual,
    })
  } catch (error) {
    console.error("[v0] Update error:", error)
    return NextResponse.json(
      { error: "Update failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
