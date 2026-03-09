// app/api/admin/exhibitor/exhibitor-appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, cancelReason } = body

    // Get admin session
    const token = await getToken({ req: request })
    
    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminId = token.id

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            title: true
          }
        },
        exhibitor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            company: true
          }
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status
    }

    // Handle cancellation
    if (status === 'CANCELLED') {
      updateData.cancellationReason = cancelReason
      updateData.cancelledBy = adminId
      updateData.cancelledAt = new Date()
    }

    // Handle completion
    if (status === 'COMPLETED') {
      updateData.outcome = 'Completed by admin'
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData
    })

    // Get admin type (Super Admin or Sub Admin)
    const admin = await prisma.superAdmin.findUnique({
      where: { id: adminId },
      select: { role: true }
    }) || await prisma.subAdmin.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    const adminType = admin?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SUB_ADMIN'

    // Create admin log for the status change with null checks
    const exhibitorName = existingAppointment.exhibitor 
      ? `${existingAppointment.exhibitor.firstName || ''} ${existingAppointment.exhibitor.lastName || ''}`.trim() 
      : 'Unknown Exhibitor'
    
    const visitorName = existingAppointment.requester
      ? `${existingAppointment.requester.firstName || ''} ${existingAppointment.requester.lastName || ''}`.trim()
      : 'Unknown Visitor'

    const eventName = existingAppointment.event?.title || 'Unknown Event'

    await prisma.adminLog.create({
      data: {
        adminId: adminId,
        adminType: adminType,
        action: `APPOINTMENT_${status}`,
        resource: 'appointment',
        resourceId: id,
        details: {
          previousStatus: existingAppointment.status,
          newStatus: status,
          cancelReason: cancelReason,
          appointmentId: id,
          exhibitor: exhibitorName,
          visitor: visitorName,
          event: eventName
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    })

  } catch (error: any) {
    console.error('Error updating appointment:', error)
    
    if (error.code === 'P2023') {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        },
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            jobTitle: true,
            avatar: true
          }
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            jobTitle: true,
            avatar: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Transform with null checks
    const transformedAppointment = {
      ...appointment,
      exhibitor: appointment.exhibitor ? {
        ...appointment.exhibitor,
        name: `${appointment.exhibitor.firstName || ''} ${appointment.exhibitor.lastName || ''}`.trim() || 'Unknown Exhibitor',
        companyName: appointment.exhibitor.company || 'No Company'
      } : {
        id: 'unknown',
        name: 'Unknown Exhibitor',
        email: 'unknown@example.com',
        company: 'Unknown Company',
        companyName: 'Unknown Company'
      },
      requester: appointment.requester ? {
        ...appointment.requester,
        name: `${appointment.requester.firstName || ''} ${appointment.requester.lastName || ''}`.trim() || 'Unknown Visitor'
      } : {
        id: 'unknown',
        name: 'Unknown Visitor',
        email: 'unknown@example.com',
        company: 'Unknown Company'
      },
      event: appointment.event ? {
        ...appointment.event,
        name: appointment.event.title
      } : {
        id: 'unknown',
        name: 'Unknown Event'
      }
    }

    return NextResponse.json({ appointment: transformedAppointment })

  } catch (error: any) {
    console.error('Error fetching appointment:', error)
    
    if (error.code === 'P2023') {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get admin session
    const token = await getToken({ req: request })
    
    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminId = token.id

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id }
    })

    // Get admin type
    const admin = await prisma.superAdmin.findUnique({
      where: { id: adminId },
      select: { role: true }
    }) || await prisma.subAdmin.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    const adminType = admin?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SUB_ADMIN'

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: adminId,
        adminType: adminType,
        action: 'APPOINTMENT_DELETED',
        resource: 'appointment',
        resourceId: id,
        details: {
          appointmentId: id,
          exhibitor: existingAppointment.exhibitorId,
          visitor: existingAppointment.requesterId,
          status: existingAppointment.status,
          title: existingAppointment.title
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: 'Appointment deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting appointment:', error)
    
    if (error.code === 'P2023') {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}