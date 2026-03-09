import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        event: {
          select: {
            title: true,   // ✅ get event name
            id: true,
          },
        },
        exhibitor: {
          select: { firstName: true, lastName: true, company: true },
        },
        requester: {
          select: { firstName: true, lastName: true, company: true },
        },
      },
    });

    return Response.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
