import { NextResponse } from "next/server"
import { Cloudinary } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const eventId = formData.get("eventId") as string
    const uploadedById = formData.get("uploadedById") as string
    const description = formData.get("description") as string | null

    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 })
    if (!eventId) return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    if (!uploadedById) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ✅ Correct Cloudinary upload
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = Cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "exhibitor-manuals",
          public_id: `${eventId}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    const result = uploadResult as any

    const exhibitorManual = await prisma.exhibitorManual.create({
      data: {
        eventId,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById,
        description: description || undefined,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: exhibitorManual })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
