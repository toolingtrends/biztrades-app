// app/api/dashboard-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dashboardType = searchParams.get('dashboardType')
    const userRole = searchParams.get('userRole')

    let whereClause: any = { isActive: true }

    if (dashboardType) {
      whereClause.dashboardType = dashboardType
    }

    if (userRole) {
      whereClause.userRole = userRole
    }

    const dashboardContent = await prisma.dashboardContent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(dashboardContent)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard content' },
      { status: 500 }
    )
  }
}