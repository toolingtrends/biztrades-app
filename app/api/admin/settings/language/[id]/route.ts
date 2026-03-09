import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await request.json()

    // In production, update language in database
    // For now, just return success with the updates
    return NextResponse.json({
      success: true,
      id,
      updates,
    })
  } catch (error) {
    console.error("Error updating language:", error)
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // In production, delete language from database
    return NextResponse.json({
      success: true,
      deleted: id,
    })
  } catch (error) {
    console.error("Error deleting language:", error)
    return NextResponse.json({ error: "Failed to delete language" }, { status: 500 })
  }
}
