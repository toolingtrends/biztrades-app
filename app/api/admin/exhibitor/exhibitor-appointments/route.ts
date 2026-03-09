// app/api/admin/exhibitor/exhibitor-appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const meetingType = searchParams.get('meetingType')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (meetingType && meetingType !== 'all') {
      where.meetingType = meetingType
    }

    if (search) {
      where.OR = [
        {
          title: { contains: search, mode: 'insensitive' }
        },
        {
          id: { contains: search, mode: 'insensitive' }
        },
        {
          requesterCompany: { contains: search, mode: 'insensitive' }
        },
        {
          requesterEmail: { contains: search, mode: 'insensitive' }
        }
      ]
    }

    // First, get appointments without relations to avoid the error
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        requestedDate: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.appointment.count({ where })

    // Now fetch related data for each appointment individually with error handling
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (apt) => {
        let eventDetails = null
        let exhibitorDetails = null
        let requesterDetails = null

        // Fetch event details with error handling
        try {
          if (apt.eventId) {
            eventDetails = await prisma.event.findUnique({
              where: { id: apt.eventId },
              select: { id: true, title: true }
            })
          }
        } catch (error) {
          console.warn(`Error fetching event ${apt.eventId} for appointment ${apt.id}:`, error)
        }

        // Fetch exhibitor details with error handling
        try {
          if (apt.exhibitorId) {
            exhibitorDetails = await prisma.user.findUnique({
              where: { id: apt.exhibitorId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                avatar: true
              }
            })
          }
        } catch (error) {
          console.warn(`Error fetching exhibitor ${apt.exhibitorId} for appointment ${apt.id}:`, error)
        }

        // Fetch requester details with error handling
        try {
          if (apt.requesterId) {
            requesterDetails = await prisma.user.findUnique({
              where: { id: apt.requesterId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                jobTitle: true,
                avatar: true
              }
            })
          }
        } catch (error) {
          console.warn(`Error fetching requester ${apt.requesterId} for appointment ${apt.id}:`, error)
        }

        // Build exhibitor data with fallbacks
        const exhibitorData = exhibitorDetails ? {
          id: exhibitorDetails.id,
          companyName: exhibitorDetails.company || 'No Company',
          email: exhibitorDetails.email,
          name: `${exhibitorDetails.firstName || ''} ${exhibitorDetails.lastName || ''}`.trim() || 'Unknown Exhibitor'
        } : {
          id: 'unknown',
          companyName: 'Unknown Exhibitor',
          email: 'unknown@example.com',
          name: 'Unknown Exhibitor'
        }

        // Build visitor data with fallbacks - use requester fields from appointment as fallback
        const visitorData = requesterDetails ? {
          id: requesterDetails.id,
          name: `${requesterDetails.firstName || ''} ${requesterDetails.lastName || ''}`.trim() || 'Unknown Visitor',
          email: requesterDetails.email,
          company: requesterDetails.company,
          jobTitle: requesterDetails.jobTitle
        } : {
          id: apt.requesterId || 'unknown',
          name: 'Unknown Visitor',
          email: apt.requesterEmail || 'unknown@example.com',
          company: apt.requesterCompany || 'Unknown Company',
          jobTitle: apt.requesterTitle || 'Unknown'
        }

        // Build event data with fallbacks
        const eventData = eventDetails ? {
          id: eventDetails.id,
          name: eventDetails.title
        } : {
          id: apt.eventId || 'unknown',
          name: 'Unknown Event'
        }

        return {
          id: apt.id,
          exhibitor: exhibitorData,
          visitor: visitorData,
          event: eventData,
          scheduledAt: apt.requestedDate.toISOString(),
          duration: apt.duration,
          status: apt.status,
          meetingType: apt.meetingType,
          location: apt.location,
          notes: apt.notes,
          cancelledBy: apt.cancelledBy,
          cancelledAt: apt.cancelledAt?.toISOString(),
          cancelReason: apt.cancellationReason,
          createdAt: apt.createdAt.toISOString(),
          title: apt.title,
          description: apt.description
        }
      })
    )

    return NextResponse.json({
      appointments: appointmentsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}