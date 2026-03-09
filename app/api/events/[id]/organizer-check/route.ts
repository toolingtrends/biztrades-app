import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ isOrganizer: false }, { status: 200 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    })

    return NextResponse.json({ 
      isOrganizer: event?.organizerId === session.user.id 
    })
  } catch (error) {
    console.error('Error checking organizer status:', error)
    return NextResponse.json({ isOrganizer: false }, { status: 200 })
  }
}