import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { PrismaClient, LeadType } from "@prisma/client"

const prisma = new PrismaClient()

// Helper function to convert string to LeadType enum
function toLeadType(type: string): LeadType {
  switch (type.toUpperCase()) {
    case "ATTENDEE":
      return LeadType.ATTENDEE
    case "EXHIBITOR":
      return LeadType.EXHIBITOR
    case "SPEAKER":
      return LeadType.SPEAKER
    case "SPONSOR":
      return LeadType.SPONSOR
    case "PARTNER":
      return LeadType.PARTNER
    default:
      throw new Error(`Invalid lead type: ${type}`)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    const { type, userId } = await request.json()

    // Validate input
    if (!type || !userId) {
      return NextResponse.json(
        { error: "Type and userId are required" },
        { status: 400 }
      )
    }

    // Convert string to LeadType enum
    let leadType: LeadType
    try {
      leadType = toLeadType(type)
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid lead type. Must be one of: attendee, exhibitor, speaker, sponsor, partner" },
        { status: 400 }
      )
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if lead already exists for this user and event
    const existingLead = await prisma.eventLead.findFirst({
      where: {
        eventId,
        userId,
        type: leadType, // Use the enum value here
      },
    })

    if (existingLead) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Interest already recorded",
          lead: existingLead 
        },
        { status: 200 }
      )
    }

    // Create new lead
    const lead = await prisma.eventLead.create({
      data: {
        eventId,
        userId,
        type: leadType, // Use the enum value here
        status: "NEW",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Interest recorded successfully",
      lead,
    })
  } catch (error) {
    console.error("Error creating event lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}