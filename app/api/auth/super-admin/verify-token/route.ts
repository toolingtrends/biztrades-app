// app/api/auth/super-admin/verify-token/route.ts
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "your-secret-key") as any

    // Get fresh admin data from database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
      }
    })

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json({ error: "Invalid or inactive account" }, { status: 401 })
    }

    return NextResponse.json({
      superAdmin,
      valid: true
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}