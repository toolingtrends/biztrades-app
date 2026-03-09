import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all permitted cities (for public pages)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    const whereClause: any = {
      isActive: true,
      isPermitted: true // Only get permitted cities
    }

    if (countryId) {
      whereClause.countryId = countryId
      // Also ensure the country is permitted
      whereClause.country = {
        isActive: true,
        isPermitted: true
      }
    }

    const cities = await prisma.city.findMany({
      where: whereClause,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            flag: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get event counts for permitted cities
    const citiesWithEventCounts = await Promise.all(
      cities.map(async (city) => {
        const newSystemCount = await prisma.eventsOnCities.count({
          where: { cityId: city.id }
        })

        const oldSystemCount = await prisma.event.count({
          where: {
            venue: {
              venueCity: city.name
            },
            isPublic: true
          }
        })

        const totalEventCount = newSystemCount + oldSystemCount
        
        return {
          ...city,
          eventCount: totalEventCount
        }
      })
    )

    return NextResponse.json(citiesWithEventCounts)
  } catch (error) {
    console.error("Error fetching permitted cities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}