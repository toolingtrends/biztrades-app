import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authMiddleware } from "@/lib/auth-middleware"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request)
    
    // Check if authentication is valid
    if (!auth.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user exists and has proper role
    if (!auth.user || auth.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const subAdmins = await prisma.subAdmin.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ subAdmins })
  } catch (error) {
    console.error("Error fetching sub-admins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request)
    
    // Check if authentication is valid
    if (!auth.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user exists and has proper role
    if (!auth.user || auth.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, email, password, permissions, phone, role } = await request.json()

    if (!name || !email || !password || !permissions || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const validRoles = ["SUB_ADMIN", "MODERATOR", "SUPPORT"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const existing = await prisma.subAdmin.findUnique({ where: { email } })
    const existingSuper = await prisma.superAdmin.findUnique({ where: { email } })
    if (existing || existingSuper) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : "unknown"

    const subAdmin = await prisma.subAdmin.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        permissions,
        phone: phone || null,
        role,
        createdById: auth.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.adminLog.create({
      data: {
        adminId: auth.user.id,
        adminType: "SUPER_ADMIN",
        action: "CREATE_SUB_ADMIN",
        resource: "SUB_ADMIN",
        resourceId: subAdmin.id,
        details: {
          subAdminEmail: subAdmin.email,
          subAdminName: subAdmin.name,
          subAdminRole: subAdmin.role,
          permissions: subAdmin.permissions,
        },
        ipAddress,
        userAgent: request.headers.get("user-agent") || "",
        superAdminId: auth.user.id,
      },
    })

    return NextResponse.json(
      { message: "Sub-admin created successfully", subAdmin },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create sub-admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}