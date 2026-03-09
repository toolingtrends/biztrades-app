// components/exhibitors-tab.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Exhibitor {
  id: string
  boothId: string
  company: string
  name: string
  email: string
  phone?: string
  logo: string
  description?: string
  boothNumber: string
  status: string
  totalCost: number
  spaceReference?: string
  userId?: string
}

// Add proper interface for props
interface ExhibitorsTabProps {
  eventId: string
}

export default function ExhibitorsTab({ eventId }: ExhibitorsTabProps) {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/events/exhibitors?eventId=${eventId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch exhibitors: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Fetched exhibitors:", data.booths)
        setExhibitors(data.booths || [])
      } catch (err) {
        console.error("Error fetching exhibitors:", err)
        setError(err instanceof Error ? err.message : "Failed to load exhibitors")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchExhibitors()
    }
  }, [eventId])

  const handleExhibitorClick = (exhibitorId: string) => {
    router.push(`/exhibitor/${exhibitorId}`)
  }

  const handleDelete = async (exhibitor: Exhibitor, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the card click when deleting
    
    if (!confirm(`Are you sure you want to delete ${exhibitor.company}? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(exhibitor.id)

      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitor.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete exhibitor")
      }

      setExhibitors((prev) => prev.filter((e) => e.id !== exhibitor.id))

      toast({
        title: "Success",
        description: `${exhibitor.company} has been removed.`,
      })
    } catch (err) {
      console.error("Error deleting exhibitor:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete exhibitor",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading exhibitors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (exhibitors.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No exhibitors have registered for this event yet.</p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Exhibitor List</h2>
        <p className="text-sm text-gray-500">{exhibitors.length} Exhibitors of Current Edition</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {exhibitors.map((exhibitor) => (
          <Card 
            key={exhibitor.id} 
            className="border hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleExhibitorClick(exhibitor.id)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4 items-start mb-4">
                <div className="w-16 h-16 flex-shrink-0">
                  <Image
                    src={exhibitor.logo || "/placeholder.svg?height=96&width=96&text=Logo"}
                    alt={`${exhibitor.company} logo`}
                    width={64}
                    height={64}
                    className="object-contain shadow-sm rounded-md border border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  {exhibitor.company}
                </h3>

                {exhibitor.boothNumber && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Booth:</span>
                    <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded">{exhibitor.boothNumber}</span>
                  </div>
                )}

                {exhibitor.name && <p className="text-sm text-gray-600">{exhibitor.name}</p>}

                {exhibitor.status && (
                  <div className="flex items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        exhibitor.status === "BOOKED"
                          ? "bg-green-100 text-green-800"
                          : exhibitor.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {exhibitor.status}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => handleDelete(exhibitor, e)}
                disabled={deleting === exhibitor.id}
                className={`w-full mt-4 border-2 text-sm py-2 rounded-full font-semibold transition flex items-center justify-center border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {deleting === exhibitor.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}