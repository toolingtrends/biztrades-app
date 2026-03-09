import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// PUT - Update exhibition space cost
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; spaceId: string }> }) {
  try {
    const body = await request.json()

    const updatedSpace = await prisma.exhibitionSpace.update({
      where: { id: (await params).spaceId },
      data: {
        basePrice: body.basePrice,
        pricePerSqm: body.pricePerSqm,
        pricePerUnit: body.pricePerUnit,
      },
    })

    return NextResponse.json(updatedSpace)
  } catch (error) {
    console.error("Error updating exhibition space:", error)
    return NextResponse.json({ error: "Failed to update exhibition space" }, { status: 500 })
  }
}
