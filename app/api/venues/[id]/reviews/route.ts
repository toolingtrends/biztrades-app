import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Disable static generation for this route
export const dynamic = 'force-dynamic';

// POST: Create a new review
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review' },
        { status: 401 }
      );
    }

    // Await params before using
    const params = await context.params;
    const venueId = params.id;

    if (!venueId) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rating, title, comment } = body;

    if (!rating || !comment) {
      return NextResponse.json(
        { error: 'Rating and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const venueManager = await prisma.user.findFirst({
      where: { id: venueId, role: 'VENUE_MANAGER' }
    });

    if (!venueManager) {
      return NextResponse.json({ error: 'Venue manager not found' }, { status: 404 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        exhibitorId: venueId, // Using exhibitorId field for venue manager
        rating: parseInt(rating),
        title: title || '',
        comment,
        isApproved: true,
        isPublic: true,
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

    // Update venue manager's average rating and total reviews
    const allReviews = await prisma.review.findMany({
      where: { 
        exhibitorId: venueId, 
        isApproved: true, 
        isPublic: true 
      }
    });

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.user.update({
      where: { id: venueId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      }
    });

    return NextResponse.json(
      {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        user: review.user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating venue review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch reviews for a venue
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    
    console.log("[API] Fetching reviews for venue ID:", venueId);

    // Fetch reviews for this venue manager (using exhibitorId field)
    const reviews = await prisma.review.findMany({
      where: { 
        exhibitorId: venueId,
        isApproved: true,
        isPublic: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[API] Found reviews:", reviews.length);

    // Transform the data to match the frontend interface
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: review.user
    }));

    return NextResponse.json({
      reviews: transformedReviews,
    });
  } catch (error) {
    console.error("[API] Error fetching venue reviews:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reviews" 
    }, { status: 500 });
  }
}