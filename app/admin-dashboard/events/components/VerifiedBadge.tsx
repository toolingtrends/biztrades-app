"use client"

import { Badge } from "@/components/ui/badge"
import { ShieldCheck } from "lucide-react"
import type { Event } from "../types/event.types"

export function VerifiedBadge({ event }: { event: Event }) {
  if (!event.isVerified) return null
  return (
    <Badge className="bg-green-100 text-green-800 border border-green-300">
      {event.verifiedBadgeImage ? (
        <img
          src={event.verifiedBadgeImage}
          alt="Verified"
          className="w-4 h-4 mr-1"
          onError={(e) => {
            e.currentTarget.src = "/badge/VerifiedBADGE (1).png"
          }}
        />
      ) : (
        <ShieldCheck className="w-4 h-4 mr-1" />
      )}
      Verified
    </Badge>
  )
}
