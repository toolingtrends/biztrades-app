import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function GET(request: NextRequest, { params }: { params: { page: string } }) {
  try {
    const page = params.page

    console.log("[v0] Fetching banners for page:", page)

    // NOTE: There is currently no Express backend endpoint for banners.
    // To avoid crashing the homepage while migration is in progress,
    // we return an empty list instead of touching the legacy Prisma client.
    return NextResponse.json([])
  } catch (error) {
    console.error("[v0] Error fetching banners:", error)
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 })
  }
}
