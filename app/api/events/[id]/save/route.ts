import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const eventId = resolvedParams.id

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!prisma?.savedEvent || !prisma?.event) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/save`, {
          method: "POST",
          headers: request.headers.get("cookie") ? { cookie: request.headers.get("cookie")! } : {},
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) return NextResponse.json(data)
        return NextResponse.json(data, { status: res.status })
      } catch (e) {
        console.error("Backend save proxy failed:", e)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const existingSave = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    if (existingSave) {
      return NextResponse.json({ 
        message: "Event already saved", 
        saved: true 
      })
    }

    // Save the event
    const savedEvent = await prisma.savedEvent.create({
      data: {
        userId: session.user.id,
        eventId: eventId
      },
      include: {
        event: true
      }
    })

    return NextResponse.json({ 
      message: "Event saved successfully", 
      savedEvent 
    })

  } catch (error) {
    console.error("Error saving event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const eventId = resolvedParams.id

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!prisma?.savedEvent) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/save`, {
          method: "DELETE",
          headers: request.headers.get("cookie") ? { cookie: request.headers.get("cookie")! } : {},
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) return NextResponse.json(data)
        return NextResponse.json(data, { status: res.status })
      } catch (e) {
        console.error("Backend unsave proxy failed:", e)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    }

    await prisma.savedEvent.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    return NextResponse.json({ 
      message: "Event removed from saved" 
    })

  } catch (error) {
    console.error("Error removing saved event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const eventId = resolvedParams.id

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!prisma?.savedEvent) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/save`, {
          headers: request.headers.get("cookie") ? { cookie: request.headers.get("cookie")! } : {},
        })
        if (res.ok) {
          const data = await res.json()
          return NextResponse.json({ isSaved: !!data?.isSaved })
        }
      } catch (_) {}
      return NextResponse.json({ isSaved: false })
    }

    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    })

    return NextResponse.json({ 
      isSaved: !!savedEvent 
    })

  } catch (error) {
    console.error("Error checking saved event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}