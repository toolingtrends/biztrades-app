import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
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

    // Get all organizers for export
    const organizers = await prisma.user.findMany({
      where: { role: 'ORGANIZER' },
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
        lastLogin: true,
        totalEvents: true,
        totalRevenue: true,
        headquarters: true,
        specialties: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Organization', 'Status', 'Verified', 'Join Date', 'Last Login', 'Total Events', 'Total Revenue', 'Location', 'Specialties']
    
    const csvData = organizers.map(org => [
      org.id,
      `${org.firstName} ${org.lastName}`,
      org.email,
      org.phone || 'N/A',
      org.organizationName || 'N/A',
      org.isActive ? 'Active' : 'Suspended',
      org.isVerified ? 'Yes' : 'No',
      new Date(org.createdAt).toLocaleDateString(),
      org.lastLogin ? new Date(org.lastLogin).toLocaleDateString() : 'Never',
      org.totalEvents,
      org.totalRevenue,
      org.headquarters || 'N/A',
      org.specialties?.join(', ') || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="organizers.csv"'
      }
    })

  } catch (error) {
    console.error('Error exporting organizers:', error)
    return NextResponse.json(
      { error: 'Failed to export organizers' },
      { status: 500 }
    )
  }
}