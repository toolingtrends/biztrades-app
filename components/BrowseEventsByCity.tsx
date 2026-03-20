"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

type DbCity = {
  id: string
  name: string
  image: string | null
  country?: { id: string; name: string; code: string }
}

interface CityCount {
  city: string
  count: number
}

function normKey(s: string) {
  return s.trim().toLowerCase()
}

export default function BrowseByCity() {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [cities, setCities] = useState<DbCity[]>([])
  const [loading, setLoading] = useState(true)

  const countsByNorm = useMemo(() => {
    const m: Record<string, number> = {}
    for (const [k, v] of Object.entries(counts)) {
      m[normKey(k)] = v
    }
    return m
  }, [counts])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const [statsRes, locRes] = await Promise.all([
          apiFetch<any>("/api/events/stats?include=cities", { auth: false }),
          apiFetch<{ success?: boolean; data?: DbCity[] }>("/api/location/cities", { auth: false }),
        ])
        if (cancelled) return

        if (statsRes?.success && statsRes.cities) {
          const map: Record<string, number> = {}
          statsRes.cities.forEach((c: CityCount) => {
            if (c.city) map[c.city] = c.count
          })
          setCounts(map)
        }

        if (locRes?.success && Array.isArray(locRes.data)) {
          setCities(locRes.data)
        } else {
          setCities([])
        }
      } catch (error) {
        console.error("Error fetching cities / stats:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCityClick = (city: DbCity) => {
    router.push(`/event?location=${encodeURIComponent(city.name)}`)
  }

  const getCityCount = (cityName: string): number => {
    const direct = counts[cityName]
    if (direct != null) return direct
    return countsByNorm[normKey(cityName)] ?? 0
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      const kValue = (count / 1000).toFixed(1)
      return kValue.endsWith(".0") ? `${(count / 1000).toFixed(0)}k` : `${kValue}k`
    }
    return count.toString()
  }

  const skeletonCount = 12

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-12 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse Events By City</h2>
          <p className="text-gray-600 text-lg">Find events in your favorite cities</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 animate-pulse"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (cities.length === 0) {
    return (
      <div className="w-full bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-start">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse Events By City</h2>
            <p className="text-gray-600 text-lg">Find events in your favorite cities</p>
          </div>
          <p className="text-center text-gray-500">
            No cities are configured yet. An admin can add them in the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-start">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse Events By City</h2>
          <p className="text-gray-600 text-lg">Find events in your favorite cities</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {cities.map((city) => {
            const count = getCityCount(city.name)
            const iconSrc =
              city.image && city.image.trim() !== "" ? city.image : "/placeholder.svg"

            return (
              <button
                key={city.id}
                onClick={() => handleCityClick(city)}
                className="group bg-white p-6 shadow-md border border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={iconSrc}
                        alt={city.name}
                        className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{city.name}</h3>
                    {city.country?.name ? (
                      <p className="text-xs text-gray-400 mb-1">{city.country.name}</p>
                    ) : null}
                    <p className="text-sm font-semibold text-gray-500">
                      {formatCount(count)} Events
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
