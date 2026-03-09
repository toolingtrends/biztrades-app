"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, MapPin, Building } from "lucide-react"

interface Venue {
  id: string
  venueName?: string
  venueAddress?: string
  venueCity?: string
  venueState?: string
  venueCountry?: string
  maxCapacity?: number
  amenities: string[]
}

interface SelectVenueProps {
  selectedVenueId: string
  onVenueChange: (venueData: {
    venueId?: string
    venueName: string
    venueAddress: string
    city: string
    state?: string
    country?: string
  }) => void
}

export function SelectVenue({ selectedVenueId, onVenueChange }: SelectVenueProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newVenue, setNewVenue] = useState({
    venueName: "",
    venueAddress: "",
    venueCity: "",
    venueState: "",
    venueCountry: "",
    maxCapacity: 0,
    amenities: [] as string[]
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users?role=VENUE_MANAGER')
      if (response.ok) {
        const data = await response.json()
        setVenues(data.users || [])
      } else {
        console.error("Failed to fetch venues")
        setVenues([])
      }
    } catch (error) {
      console.error("Error fetching venues:", error)
      setVenues([])
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Added null checks for venue fields
  const filteredVenues = venues.filter(venue => {
    if (!venue) return false
    
    const searchLower = searchTerm.toLowerCase()
    
    return (
      (venue.venueName?.toLowerCase() || '').includes(searchLower) ||
      (venue.venueCity?.toLowerCase() || '').includes(searchLower) ||
      (venue.venueAddress?.toLowerCase() || '').includes(searchLower)
    )
  })

  const handleCreateVenue = async () => {
    if (!newVenue.venueName || !newVenue.venueCity) {
      alert("Please fill in venue name and city")
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newVenue,
          firstName: "Venue",
          lastName: "Manager",
          email: `venue-${Date.now()}@example.com`,
          password: "TEMP_PASSWORD",
          role: 'VENUE_MANAGER'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onVenueChange({
          venueId: data.user.id,
          venueName: data.user.venueName || '',
          venueAddress: data.user.venueAddress || '',
          city: data.user.venueCity || '',
          state: data.user.venueState,
          country: data.user.venueCountry
        })
        setShowCreateForm(false)
        setNewVenue({
          venueName: "",
          venueAddress: "",
          venueCity: "",
          venueState: "",
          venueCountry: "",
          maxCapacity: 0,
          amenities: []
        })
        fetchVenues() // Refresh the list
      } else {
        alert("Error creating venue")
      }
    } catch (error) {
      console.error("Error creating venue:", error)
      alert("Error creating venue")
    }
  }

  const selectedVenue = venues.find(venue => venue.id === selectedVenueId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Event Venue
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select an existing venue or create a new one
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Select */}
        <div className="space-y-3">
          <Label>Select Venue</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>

          {!showCreateForm && (
            <Select 
              value={selectedVenueId} 
              onValueChange={(value) => {
                const venue = venues.find(v => v.id === value)
                if (venue) {
                  onVenueChange({
                    venueId: venue.id,
                    venueName: venue.venueName || '',
                    venueAddress: venue.venueAddress || '',
                    city: venue.venueCity || '',
                    state: venue.venueState,
                    country: venue.venueCountry
                  })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : filteredVenues.length === 0 ? (
                  <SelectItem value="no-results" disabled>No venues found</SelectItem>
                ) : (
                  filteredVenues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{venue.venueName || "Unnamed Venue"}</div>
                          <div className="text-xs text-muted-foreground">
                            {venue.venueCity || "Unknown City"}, {venue.venueState || "N/A"} • Capacity: {venue.maxCapacity || "N/A"}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {selectedVenue && !showCreateForm && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedVenue.venueName || "Unnamed Venue"}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedVenue.venueAddress || "No address"}, {selectedVenue.venueCity || "Unknown City"}, {selectedVenue.venueState || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Capacity: {selectedVenue.maxCapacity || "N/A"} • {selectedVenue.amenities?.length || 0} amenities
                  </div>
                </div>
                <Badge variant="secondary">Selected</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Create New Venue Form */}
        {showCreateForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-medium">Create New Venue</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="venueName">Venue Name *</Label>
                <Input
                  id="venueName"
                  value={newVenue.venueName}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, venueName: e.target.value }))}
                  placeholder="Grand Convention Center"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="venueAddress">Address</Label>
                <Input
                  id="venueAddress"
                  value={newVenue.venueAddress}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, venueAddress: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <Label htmlFor="venueCity">City *</Label>
                <Input
                  id="venueCity"
                  value={newVenue.venueCity}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, venueCity: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="venueState">State</Label>
                <Input
                  id="venueState"
                  value={newVenue.venueState}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, venueState: e.target.value }))}
                  placeholder="NY"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="venueCountry">Country</Label>
                <Input
                  id="venueCountry"
                  value={newVenue.venueCountry}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, venueCountry: e.target.value }))}
                  placeholder="United States"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={newVenue.maxCapacity || ""}
                  onChange={(e) => setNewVenue(prev => ({ ...prev, maxCapacity: Number(e.target.value) || 0 }))}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateVenue}>
                <Plus className="w-4 h-4 mr-2" />
                Create Venue
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}