// app/api/admin-notes/[id]/collaborators/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth-options'

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params // Await params
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collaborators = await prisma.noteCollaborator.findMany({
      where: { noteId: id }, // Use awaited id
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

    return NextResponse.json(collaborators)
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params // Await params
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if user can manage collaborators
    const note = await prisma.adminNote.findUnique({
      where: { id }, // Use awaited id
      include: {
        collaborators: true
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const canManage = 
      note.createdById === session.user.id ||
      note.collaborators.some(
        collab => collab.userId === session.user.id && 
        collab.permission === 'MANAGE'
      )

    if (!canManage) {
      return NextResponse.json({ error: 'Manage permission denied' }, { status: 403 })
    }

    const collaborator = await prisma.noteCollaborator.create({
      data: {
        noteId: id, // Use awaited id
        userId: body.userId,
        permission: body.permission || 'VIEW'
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

    return NextResponse.json(collaborator, { status: 201 })
  } catch (error) {
    console.error('Error adding collaborator:', error)
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    )
  }
}