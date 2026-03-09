// app/api/events/[id]/banners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get event details first
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        category: true,
        tags: true,
        // city: true,
        // country: true,
      }
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Fetch banners for event-detail page
    const banners = await prisma.banner.findMany({
      where: {
        page: 'event-detail',
        isActive: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching event banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}