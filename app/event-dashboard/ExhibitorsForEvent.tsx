"use client"

import { useEffect, useState } from "react"
import { Loader2, Building, Mail, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface ExhibitorBooth {
  id: string
  boothNumber: string
  company: string
  name: string
  email: string
  phone?: string
  description?: string
  totalCost?: number
  status?: string
  event: {
    id: string
    title: string
    startDate: string
    endDate: string
    organizerId: string
  }
}

interface ExhibitorsForEventProps {
  eventId: string
}

export default function ExhibitorsForEvent({ eventId }: ExhibitorsForEventProps) {
  const { toast } = useToast()
  const [booths, setBooths] = useState<ExhibitorBooth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/events/exhibitors?eventId=${eventId}`)
        if (!res.ok) throw new Error("Failed to fetch exhibitors")
        const data = await res.json()
        setBooths(data.booths || [])
      } catch (err) {
        console.error("Error fetching exhibitors:", err)
        setError("Failed to load exhibitors")
        toast({
          title: "Error",
          description: "Failed to load exhibitors",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (eventId) fetchExhibitors()
  }, [eventId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading exhibitors...</span>
      </div>
    )
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-600">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exhibitors for Event</CardTitle>
      </CardHeader>
      <CardContent>
        {booths.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No exhibitors found for this event</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exhibitor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Booth</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {booths?.map((booth) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    {booth.name}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {booth.email}
                    </div>
                    {booth.phone && (
                      <div className="text-sm text-gray-500 mt-1">{booth.phone}</div>
                    )}
                  </TableCell>

                  <TableCell>{booth.company}</TableCell>

                  <TableCell className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {booth.event?.title}
                  </TableCell>

                  <TableCell>{booth.boothNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
