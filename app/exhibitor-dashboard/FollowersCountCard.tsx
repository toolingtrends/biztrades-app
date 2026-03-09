import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface FollowersCountCardProps {
  exhibitorId: string
}

export function FollowersCountCard({ exhibitorId }: FollowersCountCardProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exhibitorId) return

    const fetchFollowers = async () => {
      try {
        const res = await fetch(`/api/follow/followers/${exhibitorId}`)
        const data = await res.json()
        // Assuming the API returns an array of followers
        setCount(data?.length || 0)
      } catch (err) {
        console.error("Failed to fetch followers:", err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowers()
  }, [exhibitorId])

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-lg" />
  }

  return (
    <div>
      
      <CardContent className="text-2xl font-bold text-gray-900">{count}</CardContent>
    </div>
  )
}
