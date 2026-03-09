import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth-options'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin (from SuperAdmin or SubAdmin tables)
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    })

    const subAdmin = await prisma.subAdmin.findUnique({
      where: { id: session.user.id }
    })

    if (!superAdmin && !subAdmin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // all, active, pending, suspended

    const skip = (page - 1) * limit

    // Build where clause for organizers (users with ORGANIZER role)
    let whereClause: any = {
      role: 'ORGANIZER'
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { organizationName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (status === 'active') {
      whereClause.isActive = true
      whereClause.isVerified = true
    } else if (status === 'pending') {
      whereClause.isVerified = false
    } else if (status === 'suspended') {
      whereClause.isActive = false
    }

    // Get organizers with pagination and related data
    const [organizers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          
          // Organizer-specific fields
          organizationName: true,
          description: true,
          headquarters: true,
          founded: true,
          teamSize: true,
          specialties: true,
          achievements: true,
          certifications: true,
          
          // Business information
          businessEmail: true,
          businessPhone: true,
          businessAddress: true,
          taxId: true,
          
          // Statistics
          totalEvents: true,
          activeEvents: true,
          totalAttendees: true,
          totalRevenue: true,
          
          // Count relationships
          _count: {
            select: {
              organizedEvents: true,
              speakers: true,
              exhibitors: true,
              venueManagers: true,
              campaigns: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({
        where: whereClause
      })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      organizers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })

  } catch (error) {
    console.error('Error fetching organizers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    })

    const subAdmin = await prisma.subAdmin.findUnique({
      where: { id: session.user.id }
    })

    if (!superAdmin && !subAdmin) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const body = await request.json()
    
    const {
      firstName,
      lastName,
      email,
      phone,
      organizationName,
      description,
      headquarters,
      founded,
      teamSize,
      specialties,
      businessEmail,
      businessPhone,
      businessAddress,
      taxId
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !organizationName) {
      return NextResponse.json(
        { error: 'First name, last name, email, and organization name are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create the organizer
    const organizer = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'ORGANIZER',
        isVerified: true, // Auto-verify when added by admin
        isActive: true,
        
        // Organizer-specific fields
        organizationName,
        description: description || null,
        headquarters: headquarters || null,
        founded: founded || null,
        teamSize: teamSize || null,
        specialties: specialties || [],
        
        // Business information
        businessEmail: businessEmail || null,
        businessPhone: businessPhone || null,
        businessAddress: businessAddress || null,
        taxId: taxId || null,
        
        // Set default values for statistics
        totalEvents: 0,
        activeEvents: 0,
        totalAttendees: 0,
        totalRevenue: 0
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        organizationName: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        headquarters: true,
        founded: true,
        teamSize: true,
        specialties: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        taxId: true
      }
    })

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        adminType: superAdmin ? 'SUPER_ADMIN' : 'SUB_ADMIN',
        action: 'ORGANIZER_CREATED',
        resource: 'ORGANIZER',
        resourceId: organizer.id,
        details: {
          organizerEmail: organizer.email,
          organizerName: organizer.organizationName,
          action: 'created',
          timestamp: new Date().toISOString(),
          tempPassword: tempPassword
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      organizer,
      tempPassword,
      message: 'Organizer created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating organizer:', error)
    return NextResponse.json(
      { error: 'Failed to create organizer' },
      { status: 500 }
    )
  }
}