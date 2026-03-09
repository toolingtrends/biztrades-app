import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST: Create a new reply to a review
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a reply' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const organizerId = params.id;
    const reviewId = params.reviewId;

    if (!organizerId || !reviewId) {
      return NextResponse.json({ error: 'Invalid organizer ID or review ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the review exists and belongs to the organizer
    const review = await prisma.review.findFirst({
      where: { 
        id: reviewId,
        organizerId: organizerId
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if the user is the organizer or the original reviewer
    const isOrganizer = user.id === organizerId;
    const isOriginalReviewer = user.id === review.userId;

    if (!isOrganizer && !isOriginalReviewer) {
      return NextResponse.json(
        { error: 'You can only reply to your own reviews or as the organizer' },
        { status: 403 }
      );
    }

    // Create the reply
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: reviewId,
        userId: user.id,
        content: content,
        isOrganizerReply: isOrganizer
      },
      include: {
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            avatar: true 
          } 
        }
      }
    });

    return NextResponse.json(
      {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        isOrganizerReply: reply.isOrganizerReply,
        user: reply.user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch replies for a review
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const params = await context.params;
    const organizerId = params.id;
    const reviewId = params.reviewId;

    if (!organizerId || !reviewId) {
      return NextResponse.json({ error: 'Invalid organizer ID or review ID' }, { status: 400 });
    }

    // Check if the review exists and belongs to the organizer
    const review = await prisma.review.findFirst({
      where: { 
        id: reviewId,
        organizerId: organizerId
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const replies = await prisma.reviewReply.findMany({
      where: { 
        reviewId: reviewId
      },
      include: {
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            avatar: true 
          } 
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      replies: replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        isOrganizerReply: reply.isOrganizerReply,
        user: reply.user
      }))
    });
  } catch (error) {
    console.error('Error fetching review replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}