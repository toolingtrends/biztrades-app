import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check both SuperAdmin and SubAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() },
    })

    const subAdmin = await prisma.subAdmin.findUnique({
      where: { email: email.toLowerCase() },
      include: { createdBy: true },
    })

    const user = superAdmin || subAdmin

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated. Please contact support." }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment login attempts
      if (superAdmin) {
        await prisma.superAdmin.update({
          where: { id: user.id },
          data: { loginAttempts: { increment: 1 } },
        })
      } else {
        await prisma.subAdmin.update({
          where: { id: user.id },
          data: { loginAttempts: { increment: 1 } },
        })
      }

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Reset login attempts on successful login
    if (superAdmin) {
      await prisma.superAdmin.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lastLogin: new Date(),
        },
      })
    } else {
      await prisma.subAdmin.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lastLogin: new Date(),
        },
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: superAdmin ? "SUPER_ADMIN" : "SUB_ADMIN",
      },
      process.env.NEXTAUTH_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    // Create session
    await prisma.adminSession.create({
      data: {
        adminId: user.id,
        adminType: superAdmin ? "SUPER_ADMIN" : "SUB_ADMIN",
        token,
        refreshToken: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceInfo: request.headers.get("user-agent") || "",
        ipAddress: request.headers.get("x-forwarded-for") || "",
        userAgent: request.headers.get("user-agent") || "",
        ...(superAdmin ? { superAdminId: user.id } : { subAdminId: user.id }),
      },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        adminType: superAdmin ? "SUPER_ADMIN" : "SUB_ADMIN",
        action: "LOGIN",
        resource: "AUTH",
        ipAddress: request.headers.get("x-forwarded-for") || "",
        userAgent: request.headers.get("user-agent") || "",
        ...(superAdmin ? { superAdminId: user.id } : { subAdminId: user.id }),
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    const responseData = {
      message: "Login successful",
      token,
      user: {
        ...userWithoutPassword,
        role: superAdmin ? "SUPER_ADMIN" : "SUB_ADMIN",
        ...(subAdmin && { createdBy: subAdmin.createdBy.name }),
      },
    }

    const response = NextResponse.json(responseData)

    // Set cookie
    response.cookies.set("superAdminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
