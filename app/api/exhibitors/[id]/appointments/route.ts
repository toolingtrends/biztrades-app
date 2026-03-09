import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid exhibitor ID" }, { status: 400 })
    }

    // Mock appointments data
    const appointments = [
      {
        id: "apt-1",
        status: "CONFIRMED",
        type: "PRODUCT_DEMO",
        title: "Smart Display System Demo",
        scheduledAt: "2024-03-20T14:00:00Z",
        duration: 60,
        location: "Booth A-123, Tech Conference 2024",
        meetingLink: null,
        notes: "Product demonstration for TechCorp Solutions. Focus on enterprise features and ROI.",
        reminderSent: true,
        createdAt: "2024-02-20T10:30:00Z",
        updatedAt: "2024-02-21T09:15:00Z",
        visitor: {
          id: "visitor-1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@techcorp.com",
          phone: "+1-555-0123",
          company: "TechCorp Solutions",
          jobTitle: "IT Director",
          avatar: "/professional-man.png",
        },
        agenda: ["Product overview and key features", "Live demonstration", "Q&A session", "Pricing discussion"],
      },
      {
        id: "apt-2",
        status: "PENDING",
        type: "CONSULTATION",
        title: "Software Platform Consultation",
        scheduledAt: "2024-03-22T10:30:00Z",
        duration: 45,
        location: "Virtual Meeting",
        meetingLink: "https://meet.example.com/abc-123",
        notes: "Initial consultation for software implementation. Discuss requirements and timeline.",
        reminderSent: false,
        createdAt: "2024-02-21T16:45:00Z",
        updatedAt: "2024-02-21T16:45:00Z",
        visitor: {
          id: "visitor-2",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.j@innovatebiz.com",
          phone: "+1-555-0456",
          company: "Innovate Business Solutions",
          jobTitle: "Operations Manager",
          avatar: "/professional-woman-diverse.png",
        },
        agenda: [
          "Business requirements analysis",
          "Software capabilities overview",
          "Implementation timeline",
          "Support and training options",
        ],
      },
      {
        id: "apt-3",
        status: "COMPLETED",
        type: "FOLLOW_UP",
        title: "Post-Purchase Follow-up",
        scheduledAt: "2024-02-15T15:00:00Z",
        duration: 30,
        location: "Phone Call",
        meetingLink: null,
        notes: "Follow-up call after software purchase. Ensure smooth onboarding and address any questions.",
        reminderSent: true,
        createdAt: "2024-02-10T11:20:00Z",
        updatedAt: "2024-02-15T15:30:00Z",
        visitor: {
          id: "visitor-4",
          firstName: "Lisa",
          lastName: "Chen",
          email: "lisa.chen@startupxyz.com",
          phone: "+1-555-0321",
          company: "StartupXYZ",
          jobTitle: "Founder & CEO",
          avatar: "/professional-asian-woman.png",
        },
        agenda: ["Onboarding progress check", "Feature walkthrough", "Training schedule", "Next steps"],
        outcome: "Successful onboarding completed. Customer satisfied with the platform.",
      },
      {
        id: "apt-4",
        status: "CANCELLED",
        type: "PRODUCT_DEMO",
        title: "Exhibition Booth Demo",
        scheduledAt: "2024-02-25T11:00:00Z",
        duration: 45,
        location: "Showroom",
        meetingLink: null,
        notes: "Demo cancelled by client due to scheduling conflict. Rescheduling for next week.",
        reminderSent: false,
        createdAt: "2024-02-18T14:15:00Z",
        updatedAt: "2024-02-24T09:30:00Z",
        visitor: {
          id: "visitor-5",
          firstName: "Robert",
          lastName: "Wilson",
          email: "robert.w@eventmanagers.com",
          phone: "+1-555-0654",
          company: "Event Managers Inc",
          jobTitle: "Senior Event Planner",
          avatar: "/professional-man-suit.png",
        },
        agenda: ["Booth setup demonstration", "Material quality review", "Pricing options"],
        cancellationReason: "Client scheduling conflict",
      },
    ]

    return NextResponse.json({
      success: true,
      appointments,
    })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid exhibitor ID" }, { status: 400 })
    }

    // Mock appointment creation
    const newAppointment = {
      id: `apt-${Date.now()}`,
      status: "PENDING",
      type: body.type,
      title: body.title,
      scheduledAt: body.scheduledAt,
      duration: body.duration || 60,
      location: body.location,
      meetingLink: body.meetingLink,
      notes: body.notes,
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visitor: body.visitor,
      agenda: body.agenda || [],
    }

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      message: "Appointment scheduled successfully",
    })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid exhibitor ID" }, { status: 400 })
    }

    // Mock appointment update
    const updatedAppointment = {
      id: body.appointmentId,
      status: body.status,
      title: body.title,
      scheduledAt: body.scheduledAt,
      duration: body.duration,
      location: body.location,
      meetingLink: body.meetingLink,
      notes: body.notes,
      agenda: body.agenda,
      updatedAt: new Date().toISOString(),
      outcome: body.outcome,
      cancellationReason: body.cancellationReason,
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: "Appointment updated successfully",
    })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid exhibitor ID" }, { status: 400 })
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
