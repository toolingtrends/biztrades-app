import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const appointments = await prisma.venueAppointment.findMany({
      where: {
        requesterId: { not: undefined },
        venueId: { not: undefined },
      },
      include: {
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            venueName: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching venue appointments:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load venue appointments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
