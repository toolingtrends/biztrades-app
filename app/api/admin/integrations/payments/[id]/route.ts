import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // In a real application, fetch gateway configuration from database
    const gateway = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      isActive: id === "stripe",
      isTestMode: true,
      credentials: {
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
        merchantId: "",
      },
    }

    return NextResponse.json({ gateway })
  } catch (error) {
    console.error("Error fetching gateway:", error)
    return NextResponse.json({ error: "Failed to fetch gateway" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // In a real application, save gateway configuration to database
    // For now, just return success
    console.log(`Updating gateway ${id}:`, body)

    return NextResponse.json({
      success: true,
      message: `Gateway ${id} configuration updated successfully`,
    })
  } catch (error) {
    console.error("Error updating gateway:", error)
    return NextResponse.json({ error: "Failed to update gateway" }, { status: 500 })
  }
}
