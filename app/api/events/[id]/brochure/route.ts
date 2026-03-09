import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// ✅ Allowed file types
const VALID_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
// ✅ Max file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Helper function to extract public_id from Cloudinary URL
function extractPublicId(cloudinaryUrl: string): string {
  try {
    const url = new URL(cloudinaryUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the index after 'upload'
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      throw new Error("Invalid Cloudinary URL format");
    }
    
    // Get the parts after upload (version and public_id)
    const publicIdParts = pathParts.slice(uploadIndex + 2); // Skip 'upload' and version
    let publicId = publicIdParts.join('/');
    
    // Remove file extension
    publicId = publicId.replace(/\.[^/.]+$/, "");
    
    return publicId;
  } catch (error) {
    console.error("Error extracting public_id from URL:", cloudinaryUrl);
    console.error("Extraction error:", error);
    throw new Error("Invalid Cloudinary URL");
  }
}

// ========================
// PUT — Upload / Replace Brochure
// ========================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const brochureFile = formData.get("brochure") as File | null;

    if (!brochureFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!VALID_FILE_TYPES.includes(brochureFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or image file." },
        { status: 400 }
      );
    }

    if (brochureFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 10MB." },
        { status: 400 }
      );
    }

    // Get existing event to check for old brochure
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { brochure: true }
    });

    // Delete old brochure from Cloudinary if exists
    if (existingEvent?.brochure && existingEvent.brochure.includes('cloudinary.com')) {
      try {
        console.log("Deleting old brochure:", existingEvent.brochure);
        const publicId = extractPublicId(existingEvent.brochure);
        console.log("Extracted public_id for deletion:", publicId);
        
        const deleteResult = await deleteFromCloudinary(publicId);
        console.log("Delete result:", deleteResult);
      } catch (deleteError) {
        console.error("Error deleting old brochure:", deleteError);
        // Continue with upload even if delete fails
      }
    }

    // ✅ Upload to Cloudinary
    console.log("Uploading new brochure...");
    const uploadResult = await uploadToCloudinary(brochureFile, 'events/brochures');
    console.log("Upload result:", uploadResult.secure_url);

    // ✅ Update DB with Cloudinary URL
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { brochure: uploadResult.secure_url },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating brochure:", error);
    return NextResponse.json(
      { error: "Failed to update brochure" },
      { status: 500 }
    );
  }
}

// ========================
// GET — View or Download Brochure
// ========================

// ========================
// GET — View or Download Brochure
// ========================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "view" | "download"

    const event = await prisma.event.findUnique({
      where: { id },
      select: { brochure: true, title: true },
    });

    if (!event?.brochure) {
      return NextResponse.json({ error: "Brochure not found" }, { status: 404 });
    }

    let brochureUrl = event.brochure;

    // For download action - modify Cloudinary URL for download
    if (event.brochure.includes('cloudinary.com') && action === "download") {
      brochureUrl = event.brochure.replace('/upload/', '/upload/fl_attachment/');
      
      // Return the modified URL in JSON for frontend to handle
      return NextResponse.json({ 
        success: true,
        brochure: brochureUrl,
        action: 'download',
        eventTitle: event.title,
        message: "Download URL generated"
      });
    }

    // For view action - return the original URL
    if (action === "view") {
      return NextResponse.json({
        success: true,
        brochure: brochureUrl,
        action: 'view',
        eventTitle: event.title,
        message: "View URL generated"
      });
    }

    // Default: return JSON info
    return NextResponse.json({ 
      success: true,
      brochure: brochureUrl,
      action: action || 'view',
      eventTitle: event.title,
      message: "URL generated"
    });

  } catch (error) {
    console.error("❌ Error fetching brochure:", error);
    return NextResponse.json({ error: "Failed to fetch brochure" }, { status: 500 });
  }
}


// ========================
// DELETE — Remove Brochure
// ========================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { brochure: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.brochure) {
      return NextResponse.json({ error: "No brochure to delete" }, { status: 404 });
    }

    // ✅ Delete from Cloudinary if exists
    if (event.brochure.includes('cloudinary.com')) {
      try {
        console.log("Deleting brochure from Cloudinary:", event.brochure);
        const publicId = extractPublicId(event.brochure);
        console.log("Extracted public_id for deletion:", publicId);
        
        const deleteResult = await deleteFromCloudinary(publicId);
        console.log("Delete result:", deleteResult);
      } catch (deleteError) {
        console.error("Error deleting brochure from Cloudinary:", deleteError);
        // Don't fail the request if Cloudinary deletion fails
      }
    }

    // ✅ Remove brochure field from DB
    await prisma.event.update({
      where: { id },
      data: { brochure: null },
    });

    return NextResponse.json(
      { message: "Brochure removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting brochure:", error);
    return NextResponse.json(
      { error: "Failed to delete brochure" },
      { status: 500 }
    );
  }
}