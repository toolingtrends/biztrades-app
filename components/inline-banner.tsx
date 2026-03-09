"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Banner {
  id: string
  page: string
  title: string
  imageUrl: string
  link?: string
  order: number
  isActive: boolean
}

interface InlineBannerProps {
  page: string
  maxBanners?: number
  dismissible?: boolean
  className?: string
}

export function InlineBanner({ page, maxBanners = 3, dismissible = true, className = "" }: InlineBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem(`dismissed-banners-${page}`)
    if (dismissed) {
      setDismissedBanners(new Set(JSON.parse(dismissed)))
    }
  }, [page])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/banners/${page}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data.slice(0, maxBanners))
      }
    } catch (error) {
      console.error("Error fetching banners:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBannerClick = async (banner: Banner) => {
    // Track click
    try {
      await fetch(`/api/banners/track/${banner.id}`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Error tracking banner click:", error)
    }

    if (banner.link) {
      window.open(banner.link, "_blank")
    }
  }

  const dismissBanner = (bannerId: string) => {
    const newDismissed = new Set(dismissedBanners)
    newDismissed.add(bannerId)
    setDismissedBanners(newDismissed)
    localStorage.setItem(`dismissed-banners-${page}`, JSON.stringify(Array.from(newDismissed)))
  }

  const visibleBanners = banners.filter((banner) => !dismissedBanners.has(banner.id))

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${className}`}>
        {Array.from({ length: Math.min(maxBanners, 3) }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (visibleBanners.length === 0) {
    return null
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {visibleBanners.map((banner) => (
        <div
          key={banner.id}
          className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div
            className={`relative h-32 ${banner.link ? "cursor-pointer" : ""}`}
            onClick={() => handleBannerClick(banner)}
          >
            <Image
              src={banner.imageUrl || "/placeholder.svg"}
              alt={banner.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>

          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={(e) => {
                e.stopPropagation()
                dismissBanner(banner.id)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
