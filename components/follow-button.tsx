"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FollowButtonProps {
  userId: string
  currentUserId?: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function FollowButton({ userId, currentUserId, variant = "default", size = "default" }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check if already following on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/follow/${userId}?currentUserId=${currentUserId}`)
        const data = await response.json()
        setIsFollowing(data.isFollowing)
      } catch (error) {
        console.error("[v0] Error checking follow status:", error)
      }
    }

    if (userId && currentUserId && userId !== currentUserId) {
      checkFollowStatus()
    }
  }, [userId, currentUserId])

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow exhibitors",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follow/${userId}?currentUserId=${currentUserId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to unfollow")
        }

        setIsFollowing(false)
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this exhibitor",
        })
      } else {
        // Follow
        const response = await fetch(`/api/follow/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentUserId }),
        })

        if (!response.ok) {
          throw new Error("Failed to follow")
        }

        setIsFollowing(true)
        toast({
          title: "Following",
          description: "You are now following this exhibitor",
        })
      }
    } catch (error) {
      console.error("[v0] Error toggling follow:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if viewing own profile
  if (userId === currentUserId) {
    return null
  }

  return (
<button
  onClick={handleFollow}
  disabled={isLoading}
  className={` py-2 rounded-md font-medium ${
    isFollowing
      ? "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
      : "text-blue-600"
  }`}
>
  {isFollowing ? "Following" : "Follow"}
</button>

  )
}
