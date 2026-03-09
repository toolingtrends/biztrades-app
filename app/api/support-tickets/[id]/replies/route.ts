// app/api/support-tickets/[id]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const replies = await prisma.supportTicketReply.findMany({
      where: { ticketId: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(replies)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ticket replies' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const newReply = await prisma.supportTicketReply.create({
      data: {
        ...body,
        ticketId: params.id
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Update ticket status if needed
    if (body.updateStatus) {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: body.updateStatus }
      })
    }

    return NextResponse.json(newReply, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create ticket reply' },
      { status: 500 }
    )
  }
}