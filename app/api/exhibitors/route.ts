import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all users with EXHIBITOR role
    const exhibitors = await prisma.user.findMany({
      where: {
        role: "EXHIBITOR",
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        company: true,
        jobTitle: true,
        location: true,
        website: true,
        linkedin: true,
        twitter: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        taxId: true,
      },
    })

    return NextResponse.json({ exhibitors })
  } catch (error) {
    console.error("Error fetching exhibitors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      company,
      jobTitle,
      location,
      website,
      linkedin,
      twitter,
      businessEmail,
      businessPhone,
      businessAddress,
      taxId,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !company) {
      return NextResponse.json(
        {
          error: "Missing required fields: firstName, lastName, email, company",
        },
        { status: 400 },
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    // Create new exhibitor
    const exhibitor = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        bio,
        company,
        jobTitle,
        location,
        website,
        linkedin,
        twitter,
        businessEmail,
        businessPhone,
        businessAddress,
        taxId,
        role: "EXHIBITOR",
        isActive: true,
        isVerified: false,
      },
    })

    return NextResponse.json({ exhibitor }, { status: 201 })
  } catch (error) {
    console.error("Error creating exhibitor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
