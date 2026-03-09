import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all permitted countries (for public pages)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCities = searchParams.get('includeCities') === 'true'

    const countries = await prisma.country.findMany({
      where: {
        isActive: true,
        isPermitted:true // Only get permitted countries
      },
      include: {
        cities: includeCities ? {
          where: {
            isActive: true,
            isPermitted: true // Only get permitted cities
          },
          orderBy: { name: 'asc' }
        } : false,
        _count: {
          select: {
            cities: includeCities ? false : {
              where: {
                isActive: true,
                isPermitted: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get event counts for permitted countries
    const countriesWithEventCounts = await Promise.all(
      countries.map(async (country) => {
        // Get all permitted cities for this country
        const permittedCities = await prisma.city.findMany({
          where: { 
            countryId: country.id,
            isActive: true,
            isPermitted: true
          },
          select: { id: true, name: true }
        })

        let totalEventCount = 0

        // Count events for each permitted city
        for (const city of permittedCities) {
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

          totalEventCount += newSystemCount + oldSystemCount
        }

        // Add country-level events
        const countryNewSystemCount = await prisma.eventsOnCountries.count({
          where: { countryId: country.id }
        })

        const countryOldSystemCount = await prisma.event.count({
          where: {
            OR: [
              { venue: { venueCountry: country.name } },
              { venue: { venueCountry: { contains: country.name, mode: 'insensitive' } } },
              { venue: { venueCountry: { contains: country.code, mode: 'insensitive' } } }
            ],
            isPublic: true
          }
        })

        totalEventCount += countryNewSystemCount + countryOldSystemCount

        return {
          ...country,
          eventCount: totalEventCount,
          cityCount: permittedCities.length
        }
      })
    )

    return NextResponse.json(countriesWithEventCounts)
  } catch (error) {
    console.error("Error fetching permitted countries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}