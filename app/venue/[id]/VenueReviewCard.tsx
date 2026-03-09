"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

interface VenueReviewCardProps {
  review: Review
}

export default function VenueReviewCard({ review }: VenueReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.firstName} />
            <AvatarFallback>
              {review.user.firstName[0]}
              {review.user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">
              {review.user.firstName} {review.user.lastName}
            </p>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {review.title && <p className="font-semibold text-gray-900">{review.title}</p>}
      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
  )
}
