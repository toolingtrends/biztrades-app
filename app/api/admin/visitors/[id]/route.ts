import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    const visitor = await prisma.user.findUnique({
      where: {
        id: id,
        role: "ATTENDEE"
      },
      include: {
        registrations: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true
              }
            }
          }
        },
        connectionsSent: {
          include: {
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true
              }
            }
          }
        },
        connectionsReceived: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true
              }
            }
          }
        },
        appointmentsRequested: {
          include: {
            exhibitor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true
              }
            },
            event: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        savedEvents: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true
              }
            }
          }
        }
      }
    })

    if (!visitor) {
      return NextResponse.json(
        { success: false, error: "Visitor not found" },
        { status: 404 }
      )
    }

    // Transform the data to match frontend expectations
    const transformedVisitor = {
      id: visitor.id,
      name: `${visitor.firstName} ${visitor.lastName}`,
      email: visitor.email,
      phone: visitor.phone,
      avatar: visitor.avatar,
      company: visitor.company,
      jobTitle: visitor.jobTitle,
      location: visitor.location,
      bio: visitor.bio,
      website: visitor.website,
      social: {
        linkedin: visitor.linkedin,
        twitter: visitor.twitter,
        instagram: visitor.instagram
      },
      isVerified: visitor.isVerified,
      isActive: visitor.isActive,
      lastLogin: visitor.lastLogin?.toISOString(),
      createdAt: visitor.createdAt.toISOString(),
      updatedAt: visitor.updatedAt.toISOString(),
      stats: {
        totalRegistrations: visitor.registrations.length,
        confirmedRegistrations: visitor.registrations.filter(r => r.status === "CONFIRMED").length,
        totalConnections: visitor.connectionsSent.length + visitor.connectionsReceived.length,
        acceptedConnections: [
          ...visitor.connectionsSent.filter(c => c.status === "ACCEPTED"),
          ...visitor.connectionsReceived.filter(c => c.status === "ACCEPTED")
        ].length,
        totalAppointments: visitor.appointmentsRequested.length,
        completedAppointments: visitor.appointmentsRequested.filter(a => a.status === "COMPLETED").length,
        savedEvents: visitor.savedEvents.length
      },
      registrations: visitor.registrations.map(reg => ({
        id: reg.id,
        event: reg.event,
        status: reg.status,
        registeredAt: reg.registeredAt.toISOString()
      })),
      connections: [
        ...visitor.connectionsSent.map(conn => ({
          id: conn.id,
          type: 'sent' as const,
          user: {
            id: conn.receiver.id,
            name: `${conn.receiver.firstName} ${conn.receiver.lastName}`,
            email: conn.receiver.email,
            company: conn.receiver.company
          },
          status: conn.status,
          createdAt: conn.createdAt.toISOString()
        })),
        ...visitor.connectionsReceived.map(conn => ({
          id: conn.id,
          type: 'received' as const,
          user: {
            id: conn.sender.id,
            name: `${conn.sender.firstName} ${conn.sender.lastName}`,
            email: conn.sender.email,
            company: conn.sender.company
          },
          status: conn.status,
          createdAt: conn.createdAt.toISOString()
        }))
      ],
      appointments: visitor.appointmentsRequested.map(apt => ({
        id: apt.id,
        title: apt.title,
        exhibitor: {
          id: apt.exhibitor.id,
          name: `${apt.exhibitor.firstName} ${apt.exhibitor.lastName}`,
          company: apt.exhibitor.company
        },
        event: apt.event ? {
          id: apt.event.id,
          title: apt.event.title
        } : undefined,
        status: apt.status,
        requestedDate: apt.requestedDate.toISOString()
      })),
      savedEvents: visitor.savedEvents.map(saved => ({
        id: saved.id,
        event: saved.event
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedVisitor
    })
  } catch (error) {
    console.error("Error fetching visitor:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch visitor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const visitor = await prisma.user.update({
      where: {
        id: id,
        role: "ATTENDEE"
      },
      data: body
    })

    return NextResponse.json({
      success: true,
      data: visitor
    })
  } catch (error) {
    console.error("Error updating visitor:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update visitor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // First check if visitor exists
    const visitor = await prisma.user.findUnique({
      where: {
        id: id,
        role: "ATTENDEE"
      }
    })

    if (!visitor) {
      return NextResponse.json(
        { success: false, error: "Visitor not found" },
        { status: 404 }
      )
    }

    // Delete the visitor
    await prisma.user.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Visitor deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting visitor:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete visitor" },
      { status: 500 }
    )
  }
}