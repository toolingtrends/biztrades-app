import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// ✅ Allowed file types
const VALID_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
// ✅ Max file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// ========================
// PUT — Upload / Replace Layout
// ========================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const layoutFile = formData.get("layout") as File | null

    if (!layoutFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!VALID_FILE_TYPES.includes(layoutFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or image file." },
        { status: 400 }
      )
    }

    if (layoutFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 10MB." },
        { status: 400 }
      )
    }

    // Get existing event to check for old layout
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { layoutPlan: true }
    });

    // Delete old layout from Cloudinary if exists
    if (existingEvent?.layoutPlan) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = existingEvent.layoutPlan.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const fullPublicId = `events/layouts/${publicId}`;
        
        await deleteFromCloudinary(fullPublicId);
      } catch (deleteError) {
        console.error("Error deleting old layout:", deleteError);
        // Continue with upload even if delete fails
      }
    }

    // ✅ Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(layoutFile, 'events/layouts');

    // ✅ Update DB with Cloudinary URL
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { layoutPlan: uploadResult.secure_url },
    })

    return NextResponse.json(updatedEvent, { status: 200 })
  } catch (error) {
    console.error("❌ Error updating layout:", error)
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    )
  }
}

// ========================
// DELETE — Remove Layout
// ========================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { layoutPlan: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // ✅ Delete from Cloudinary if exists
    if (event.layoutPlan && event.layoutPlan.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = event.layoutPlan.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const fullPublicId = `events/layouts/${publicId}`;
        
        await deleteFromCloudinary(fullPublicId);
      } catch (deleteError) {
        console.error("Error deleting layout from Cloudinary:", deleteError);
      }
    }

    // ✅ Remove layout field from DB
    await prisma.event.update({
      where: { id },
      data: { layoutPlan: null },
    })

    return NextResponse.json(
      { message: "Layout plan removed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error deleting layout:", error)
    return NextResponse.json(
      { error: "Failed to delete layout" },
      { status: 500 }
    )
  }
}