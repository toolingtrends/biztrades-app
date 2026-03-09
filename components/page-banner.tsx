"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

interface PageBannerProps {
  page: string
  height?: number
  autoplay?: boolean
  autoplayInterval?: number
  showControls?: boolean
  className?: string
}

export function PageBanner({
  page,
  height = 400,
  autoplay = true,
  autoplayInterval = 5000,
  showControls = true,
  className = "",
}: PageBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [page])

  useEffect(() => {
    if (!autoplay || banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [autoplay, autoplayInterval, banners.length])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/banners/${page}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
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

    // Navigate if link exists
    if (banner.link) {
      window.location.href = banner.link
    }
  }

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  if (isLoading) {
    return <div className={`relative w-full bg-muted animate-pulse ${className}`} style={{ height: `${height}px` }} />
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      {/* Banner Image */}
      <div
        className={`relative w-full h-full ${currentBanner.link ? "cursor-pointer" : ""}`}
        onClick={() => currentBanner.link && handleBannerClick(currentBanner)}
      >
        <Image
          src={currentBanner.imageUrl || "/placeholder.svg"}
          alt={currentBanner.title}
          fill
          className=""
          priority
        />

        {/* Optional overlay with title */}
        {/* {currentBanner.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white">{currentBanner.title}</h2>
          </div>
        )} */}
      </div>

      {/* Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          {/* <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={prevBanner}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={nextBanner}
          >
            <ChevronRight className="h-4 w-4" />
          </Button> */}

          {/* Dots Indicator */}
          {/* <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div> */}
        </>
      )}
    </div>
  )
}
