import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AppointmentsCountCardProps {
  exhibitorId: string
}

export function AppointmentsCountCard({ exhibitorId }: AppointmentsCountCardProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exhibitorId) return

    const fetchAppointments = async () => {
      try {
        const res = await fetch(`/api/appointments?exhibitorId=${exhibitorId}`)
        const data = await res.json()
        // Assuming API returns an array of appointments
        setCount(data?.length || 0)
      } catch (err) {
        console.error("Failed to fetch appointments:", err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
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
