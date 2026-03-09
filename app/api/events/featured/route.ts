import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/featured`, {
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("Featured events backend error:", res.status, await res.text())
      return NextResponse.json([], { status: 200 })
    }

    const data = await res.json()

    // Backend returns an array of events; keep the same shape (array) as before
    const events = Array.isArray(data) ? data : data.events ?? []

    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error("Failed to fetch featured events:", error)
    return NextResponse.json([], { status: 200 })
  }
}
