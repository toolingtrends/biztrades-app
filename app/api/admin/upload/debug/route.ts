// app/api/admin/upload/debug/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      hasFile: !!file
    })

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", details: "File is null or undefined" },
        { status: 400 }
      )
    }

    // Check if file is actually a File object
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file object", details: `Type: ${typeof file}` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Only image files are allowed", details: `File type: ${file.type}` },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB", details: `File size: ${file.size} bytes` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      message: "File validation passed"
    })

  } catch (error) {
    console.error("Debug upload error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}