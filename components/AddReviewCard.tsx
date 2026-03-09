"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageCircle, Send } from "lucide-react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"

interface ReviewReply {
  id: string
  content: string
  createdAt: string
  isOrganizerReply: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

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
  replies?: ReviewReply[]
}

interface ReviewsProps {
  eventId: string
  isOrganizer?: boolean
}

export default function Reviews({ eventId, isOrganizer = false }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/reviews`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch reviews')
      }
      
      const data = await res.json()
console.log('Fetched reviews:', data)

// Use data.reviews instead of data
const reviewsWithReplies = await Promise.all(
  (data.reviews || []).map(async (review: Review) => {
    // <CHANGE> Only fetch replies if the current user is an organizer
    if (!isOrganizer) {
      return { ...review, replies: [] }
    }

    try {
      console.log(`Fetching replies for review ${review.id}`)
      const repliesRes = await fetch(`/api/reviews/${review.id}/replies`)
      
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json()
        return { ...review, replies: repliesData.replies || [] }
      }
    } catch (error) {
      console.error(`Error fetching replies for review ${review.id}:`, error)
    }
    return { ...review, replies: [] }
  })
)

setReviews(reviewsWithReplies)

      
      
    } catch (err) {
      console.error('Error in fetchReviews:', err) // Debug log
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [eventId])

  const handleReviewAdded = () => {
    fetchReviews()
  }

  const handleReplyAdded = (reviewId: string) => {
    // Refresh specific review's replies or all reviews
    fetchReviews()
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Review Form - only show for non-organizers */}
      {!isOrganizer && (
        <AddReviewCard eventId={eventId} onReviewAdded={handleReviewAdded} />
      )}
      
      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              No reviews yet. Be the first to review this event!
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Reviews ({reviews.length})</h3>
          {reviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              isOrganizer={isOrganizer}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Review Card Component with Replies
function ReviewCard({ 
  review, 
  isOrganizer = false, 
  onReplyAdded 
}: { 
  review: Review
  isOrganizer?: boolean
  onReplyAdded: (reviewId: string) => void
}) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const hasReplies = review.replies && review.replies.length > 0
  
  console.log(`Review ${review.id} has replies:`, hasReplies, review.replies) // Debug log

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {review.user?.avatar ? (
              <img
                src={review.user?.avatar}
                alt={`${review.user.firstName} ${review.user.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {review.user.firstName[0]}{review.user.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h4 className="font-medium">
                {review.user.firstName} {review.user.lastName}
              </h4>
              <p className="text-sm text-gray-500">
                {format(new Date(review.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
            <span className="ml-1 text-sm font-medium">{review.rating}</span>
          </div>
        </div>

        {review.title && (
          <h5 className="font-semibold text-lg mb-2">{review.title}</h5>
        )}
        
        <p className="text-gray-700 mb-4">{review.comment}</p>

        {/* Reply Actions - Show for everyone, but only organizers can add replies */}
        <div className="flex items-center gap-3 pt-3 border-t">
          {/* Always show replies button if there are replies */}
          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2"
            >
              <MessageCircle size={16} />
              {showReplies ? 'Hide' : 'Show'} Replies ({review.replies?.length})
            </Button>
          )}
          
          {/* Only show reply form for organizers */}
          {isOrganizer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-2"
            >
              <Send size={16} />
              {showReplyForm ? 'Cancel' : 'Reply'}
            </Button>
          )}

          {/* Debug info - remove in production */}
          <span className="text-xs text-gray-400 ml-auto">
            Replies: {review.replies?.length || 0} | Organizer: {isOrganizer ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Reply Form */}
        {showReplyForm && isOrganizer && (
          <ReplyForm
            reviewId={review.id}
            onReplySubmitted={(reviewId) => {
              setShowReplyForm(false)
              onReplyAdded(reviewId)
            }}
          />
        )}

        {/* Replies List - Always show if there are replies and user clicked show */}
        {showReplies && hasReplies && (
          <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
            <h6 className="font-medium text-sm text-gray-700">Replies:</h6>
            {review.replies?.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}

        {/* Debug section - remove in production */}
        <details className="mt-4 text-xs text-gray-500">
          <summary>Debug Info</summary>
          <pre>{JSON.stringify({ 
            reviewId: review.id, 
            repliesCount: review.replies?.length || 0,
            hasReplies,
            showReplies,
            isOrganizer,
            replies: review.replies 
          }, null, 2)}</pre>
        </details>
      </CardContent>
    </Card>
  )
}

// Reply Card Component
function ReplyCard({ reply }: { reply: ReviewReply }) {
  return (
    <div className="bg-white p-3 rounded border-l-4 border-blue-200">
      <div className="flex items-start gap-3">
        {reply.user.avatar ? (
          <img
            src={reply.user?.avatar}
            alt={`${reply.user.firstName} ${reply.user.lastName}`}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-xs font-medium">
              {reply.user.firstName[0]}{reply.user.lastName[0]}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-sm">
              {reply.user.firstName} {reply.user.lastName}
            </h5>
            {reply.isOrganizerReply && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Organizer
              </span>
            )}
            <span className="text-xs text-gray-500">
              {format(new Date(reply.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
          <p className="text-sm text-gray-700">{reply.content}</p>
        </div>
      </div>
    </div>
  )
}

// Reply Form Component
function ReplyForm({ 
  reviewId, 
  onReplySubmitted 
}: { 
  reviewId: string
  onReplySubmitted: (reviewId: string) => void 
}) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      console.log(`Submitting reply for review ${reviewId}:`, content) // Debug log
      
      const res = await fetch(`/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      console.log('Reply submission response:', res.status) // Debug log

      if (res.ok) {
        const responseData = await res.json()
        console.log('Reply created:', responseData) // Debug log
        setContent("")
        onReplySubmitted(reviewId)
      } else {
        const error = await res.json()
        console.error('Reply submission error:', error) // Debug log
        alert(`❌ ${error.error || "Failed to add reply"}`)
      }
    } catch (err) {
      console.error('Reply submission exception:', err)
      alert("⚠️ Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
      <textarea
        placeholder="Write your reply as the organizer..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        rows={3}
        required
      />
      <div className="flex gap-2 mt-3">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? "Sending..." : "Send Reply"}
        </Button>
      </div>
    </form>
  )
}

// AddReviewCard Component (unchanged)
interface AddReviewCardProps {
  eventId: string
  onReviewAdded: () => void
}

function AddReviewCard({ eventId, onReviewAdded }: AddReviewCardProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim() || rating === 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, comment: feedback }),
      })

      if (res.ok) {
        alert("✅ Review added successfully!")
        setRating(0)
        setTitle("")
        setFeedback("")
        onReviewAdded()
      } else {
        const error = await res.json()
        alert(`❌ ${error.error || "Failed to add review"}`)
      }
    } catch (err) {
      console.error(err)
      alert("⚠️ Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Add Your Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  size={28}
                  className={
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : "Select rating"}
            </span>
          </div>

          <input
            type="text"
            placeholder="Review title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <textarea
            placeholder="Write your review..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
            required
          />

          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-48 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
          >
            {isSubmitting ? "Submitting..." : "Add Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}