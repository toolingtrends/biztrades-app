import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Build where clause
    const where: any = {
      requester: {
        role: "ATTENDEE", // Only get appointments from visitors
      },
    }

    if (status && status !== "all") {
      where.status = status
    }

    // Fetch appointments with related data
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data for frontend
    const transformedAppointments = appointments.map((apt) => ({
      id: apt.id,
      visitor: {
        name: `${apt.requester.firstName} ${apt.requester.lastName}`,
        email: apt.requester.email,
        phone: apt.requester.phone || undefined,
        company: apt.requester.company || undefined,
      },
      exhibitor: {
        name: `${apt.exhibitor.firstName} ${apt.exhibitor.lastName}`,
        company: apt.exhibitor.company || "N/A",
        email: apt.exhibitor.email || "N/A",
      },
      event: {
        title: apt.event.title,
        date: apt.event.startDate.toISOString(),
      },
      title: apt.title,
      description: apt.description || undefined,
      type: apt.type,
      status: apt.status,
      priority: apt.priority,
      requestedDate: apt.requestedDate.toISOString(),
      requestedTime: apt.requestedTime,
      confirmedDate: apt.confirmedDate?.toISOString(),
      confirmedTime: apt.confirmedTime || undefined,
      duration: apt.duration,
      meetingType: apt.meetingType,
      location: apt.location || undefined,
      meetingLink: apt.meetingLink || undefined,
      purpose: apt.purpose || undefined,
      createdAt: apt.createdAt.toISOString(),
    }))

    return NextResponse.json({
      appointments: transformedAppointments,
      total: transformedAppointments.length,
    })
  } catch (error) {
    console.error("Error fetching visitor appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch visitor appointments" },
      { status: 500 }
    )
  }
}
