import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const appointments = await prisma.appointment.findMany({
      where: {
        requesterId: userId, // appointments requested by this user
      },
      include: {
        exhibitor: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true, // fetch event title
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      exhibitorId: appointment.exhibitorId,
      exhibitorName:
        `${appointment.exhibitor?.firstName ?? ""} ${appointment.exhibitor?.lastName ?? ""}`.trim() ||
        "Unknown",
      exhibitorEmail: appointment.exhibitor?.email,
      exhibitorPhone: appointment.exhibitor?.phone,
      exhibitorAvatar: appointment.exhibitor?.avatar,
      exhibitorCompany: appointment.exhibitor?.company || "N/A",
      title: appointment.title,
      status: appointment.status,
      type: appointment.type,
      duration: appointment.duration,
      description: appointment.description,
      createdAt: appointment.createdAt,
      eventTitle: appointment.event?.title || "Unknown Event", // include event title
  eventStartDate: appointment.event?.startDate?.toISOString(), // ✅ convert to ISO string
  eventEndDate: appointment.event?.endDate?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
