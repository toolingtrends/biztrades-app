import { NextResponse } from "next/server"
import {Cloudinary} from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Manual ID is required" }, { status: 400 })
    }

    // Get the manual from database
    const manual = await prisma.exhibitorManual.findUnique({
      where: { id },
    })

    if (!manual) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 })
    }

    // Extract public_id from Cloudinary URL
    const urlParts = manual.fileUrl.split("/")
    const publicIdWithExtension = urlParts.slice(-2).join("/")
    const publicId = publicIdWithExtension.replace(".pdf", "")

    // Delete from Cloudinary
    await Cloudinary.uploader.destroy(publicId, { resource_type: "raw" })

    // Delete from database
    await prisma.exhibitorManual.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json(
      { error: "Delete failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
