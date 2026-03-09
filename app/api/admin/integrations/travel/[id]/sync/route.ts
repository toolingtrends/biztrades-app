import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Simulate sync operation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Partner synced successfully",
      lastSyncAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error syncing travel partner:", error)
    return NextResponse.json({ error: "Failed to sync travel partner" }, { status: 500 })
  }
}
