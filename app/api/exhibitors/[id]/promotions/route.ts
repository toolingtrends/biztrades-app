// app/api/exhibitors/[id]/promotions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {prisma} from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Exhibitor ID is required' }, { status: 400 });
    }

    const promotions = await prisma.promotion.findMany({
      where: {
        exhibitorId: id, // Use 'id' here
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            thumbnailImage: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    const formattedPromotions = promotions.map(promotion => ({
      id: promotion.id,
      eventId: promotion.eventId,
      eventName: promotion.event?.title || 'Unknown Event',
      packageType: promotion.packageType,
      status: promotion.status,
      impressions: promotion.impressions,
      clicks: promotion.clicks,
      conversions: promotion.conversions,
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate.toISOString(),
      amount: promotion.amount,
      duration: promotion.duration,
      targetCategories: promotion.targetCategories
    }));

    return NextResponse.json({
      promotions: formattedPromotions,
      total: formattedPromotions.length
    });

  } catch (error) {
    console.error('Error fetching exhibitor promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}