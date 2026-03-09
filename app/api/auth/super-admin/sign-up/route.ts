import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    })

    if (existingSuperAdmin) {
      return NextResponse.json({ error: "A super admin with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the super admin directly (no verification or OTP)
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        permissions: [
          "Dashboard Overview",
          "Events Management",
          "Organizer Management",
          "Exhibitor Management",
          "Speaker Management",
          "Venue Management",
          "Visitor Management",
          "Financial & Transactions",
          "Content Management",
          "Marketing & Communication",
          "Reports & Analytics",
          "Integrations",
          "User Roles & Permissions",
          "Settings & Configuration",
          "Help & Support",
        ],
        isActive: true, // Active immediately
      },
    })

    return NextResponse.json(
      {
        message: "Super admin created successfully",
        superAdmin: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Super admin creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
