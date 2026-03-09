import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function DELETE() {
  try {
    // Delete all sessions except current (in real app, would keep the current session)
    await prisma.adminSession.deleteMany({})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error terminating sessions:", error)
    return NextResponse.json({ error: "Failed to terminate sessions" }, { status: 500 })
  }
}
