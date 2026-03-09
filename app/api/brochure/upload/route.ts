import { NextResponse } from "next/server"
import { Cloudinary } from "@/lib/cloudinary"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const eventId = formData.get("eventId") as string | null
    const organizerId = formData.get("organizerId") as string

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!organizerId) {
      return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 })
    }

    // ✅ Validate file type (PDF, DOC, DOCX)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      )
    }

    // ✅ Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ✅ Upload to Cloudinary (using the correctly imported Cloudinary instance)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = Cloudinary.uploader.upload_stream(
        {
          resource_type: "raw", // raw for non-image files (PDF/DOC)
          folder: "event-brochures",
          public_id: `${organizerId}_${eventId || "draft"}_${Date.now()}`,
        },
        (error: unknown, result: unknown) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    const result = uploadResult as { secure_url: string }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Brochure upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
