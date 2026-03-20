"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

type DbCountry = {
  id: string
  name: string
  code: string
  flag: string | null
}

type DbCity = {
  id: string
  name: string
  image: string | null
  country?: { id: string; name: string; code: string }
}

interface CountryCount {
  country: string
  count: number
}

function normKey(s: string) {
  return s.trim().toLowerCase()
}

export default function BrowseByCountry() {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [countries, setCountries] = useState<DbCountry[]>([])
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
        const [statsRes, locRes, citiesRes] = await Promise.all([
          apiFetch<any>("/api/events/stats?include=countries", { auth: false }),
          apiFetch<{ success?: boolean; data?: DbCountry[] }>("/api/location/countries", {
            auth: false,
          }),
          apiFetch<{ success?: boolean; data?: DbCity[] }>("/api/location/cities", {
            auth: false,
          }),
        ])
        if (cancelled) return

        if (statsRes?.success && statsRes.countries) {
          const map: Record<string, number> = {}
          statsRes.countries.forEach((c: CountryCount) => {
            if (c.country) map[c.country] = c.count
          })
          setCounts(map)
        }

        if (locRes?.success && Array.isArray(locRes.data)) {
          setCountries(locRes.data)
        } else {
          setCountries([])
        }

        // Fallback: if /countries has no rows but cities endpoint works, derive unique countries.
        if (
          (!locRes?.success || !Array.isArray(locRes.data) || locRes.data.length === 0) &&
          citiesRes?.success &&
          Array.isArray(citiesRes.data)
        ) {
          const unique = new Map<string, DbCountry>()
          for (const city of citiesRes.data) {
            const c = city.country
            if (!c) continue
            if (!unique.has(c.id)) {
              unique.set(c.id, { id: c.id, name: c.name, code: c.code, flag: null })
            }
          }
          setCountries(Array.from(unique.values()))
        }
      } catch (error) {
        console.error("Error fetching countries / stats:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCountryClick = (country: DbCountry) => {
    router.push(`/event?country=${encodeURIComponent(country.name)}`)
  }

  const getCountryCount = (countryName: string): number => {
    const direct = counts[countryName]
    if (direct != null) return direct
    return countsByNorm[normKey(countryName)] ?? 0
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      const kValue = (count / 1000).toFixed(1)
      return kValue.endsWith('.0') ? `${(count / 1000).toFixed(0)}k` : `${kValue}k`
    }
    return count.toString()
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-12">
        <div className="px-6 py-6 border-b border-gray-200 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Browse Event By Country
          </h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">Loading countries...</p>
        </div>
      </div>
    )
  }

  if (countries.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-12">
        <div className="px-6 py-6 border-b border-gray-200 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Browse Event By Country
          </h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No countries are configured yet. An admin can add them in the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      <div className="overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Browse Event By Country
          </h2>
        </div>

        {/* Country Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            {countries.map((country) => {
              const eventCount = getCountryCount(country.name)
              const flagSrc =
                country.flag && country.flag.trim() !== ""
                  ? country.flag
                  : "/placeholder.svg"

              return (
                <button
                  key={country.id}
                  onClick={() => handleCountryClick(country)}
                  className="group bg-white shadow-xl p-4 hover:shadow-lg hover:shadow-gray-500 transition-all duration-200 hover:scale-105"
                >
                  <div className="aspect-[5/2] flex items-center justify-left">
                    <img
                      src={flagSrc}
                      alt={`${country.name} flag`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-left mt-2">
                    <p className="font-semibold text-gray-900">
                      {country.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCount(eventCount)} Events
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}