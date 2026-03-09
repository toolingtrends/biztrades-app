import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const translation = await request.json()

    // In production, update translation in database
    return NextResponse.json({
      success: true,
      id,
      translation,
    })
  } catch (error) {
    console.error("Error updating translation:", error)
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 })
  }
}
