"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Edit2, Trash2, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ExhibitorsTab from "./exhibitors-tab"
import EventHero from "./EventHero"
import Image from "next/image"
import { apiFetch } from "@/lib/api"

interface EventPageProps {
  params: { id: string }
}

export default function EventPage({ params }: EventPageProps) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [aboutText, setAboutText] = useState("")
  const [editingTags, setEditingTags] = useState(false)
  const [tagsText, setTagsText] = useState("")

  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null)
  const [editingSpaceData, setEditingSpaceData] = useState<any>({})
  const [updatingBrochure, setUpdatingBrochure] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (event) {
      if (event.description) {
        setAboutText(event.description)
      }
      if (event.tags) {
        setTagsText(event.tags.join(", "))
      }
    }
  }, [event])

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoading(true)
        setError(null)

        const eventId = params.id
        const data = await apiFetch<any>(`/api/events/${eventId}`, { auth: true })

        setEvent({
          ...data,

          isRegistrationOpen: data.isAvailable,
          spotsRemaining: data.availableTickets,
          images: data.images || [data.bannerImage].filter(Boolean),
          category: data.category || "General",
          tags: data.tags || [],
          venue: data.venue || {},
          currency: "₹",
        })

        setAverageRating(data.averageRating || 0)
        setTotalReviews(data.reviewCount || 0)
      } catch (err: any) {
        console.error("Error fetching event:", err)
        if (err?.status === 404) setError("Event not found")
        else setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params])

  useEffect(() => {
    if (event?.id && session?.user?.id) {
      checkIfSaved()
    }
  }, [event?.id, session?.user?.id])

  const checkIfSaved = async () => {
    try {
      const data = await apiFetch<{ isSaved: boolean }>(`/api/events/${event.id}/save`)
      setIsSaved(data.isSaved)
    } catch (error) {
      console.error("Error checking saved status:", error)
    }
  }
  // const handleDownloadBrochure = async (eventId: string) => {
  //   try {
  //     // Get the download URL from the API
  //     const response = await fetch(`/api/events/${eventId}/brochure?action=download`);

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();

  //     if (data.success && data.brochure) {
  //       // Create a temporary anchor element to trigger download
  //       const link = document.createElement('a');
  //       link.href = data.brochure;

  //       // Set the download attribute with a proper filename
  //       const filename = `brochure-${data.eventTitle || eventId}.pdf`;
  //       link.download = filename;

  //       // Append to body, click, and remove
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);

  //       toast({
  //         title: "Download Started",
  //         description: "Brochure download has started",
  //       });
  //     } else {
  //       throw new Error(data.error || 'Failed to get download URL');
  //     }
  //   } catch (error) {
  //     console.error('Error downloading brochure:', error);
  //     toast({
  //       title: "Download Failed",
  //       description: error instanceof Error ? error.message : "Failed to download brochure. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };
  const handleDeleteBrochure = async () => {
    if (!confirm("Are you sure you want to delete the brochure?")) return

    try {
      const response = await fetch(`/api/events/${event.id}/brochure`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update the event state to remove brochure
        setEvent((prev: any) => ({
          ...prev,
          brochure: null
        }))

        toast({
          title: "Success",
          description: "Brochure removed successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting brochure:", error)
      toast({
        title: "Error",
        description: "Failed to delete brochure",
        variant: "destructive",
      })
    }
  }
  const handleBrochureUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
    const isValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPEG, PNG, GIF)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB max for brochures)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setUpdatingBrochure(true)

    try {
      const formData = new FormData()
      formData.append('brochure', file)

      const response = await fetch(`/api/events/${event.id}/brochure`, {
        method: 'PUT',
        body: formData,
      })

      if (response.ok) {
        const updatedEvent = await response.json()

        // Update the event state with cache busting
        setEvent((prev: any) => ({
          ...prev,
          brochure: `${updatedEvent.brochure}?t=${Date.now()}`
        }))

        toast({
          title: "Success",
          description: "Brochure updated successfully",
        })

        // Clear the file input
        e.target.value = ''
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update brochure')
      }
    } catch (error) {
      console.error('Error updating brochure:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update brochure",
        variant: "destructive",
      })
    } finally {
      setUpdatingBrochure(false)
    }
  }
  const handleSaveEvent = async () => {
    if (!session) {
      alert("Please log in to save events")
      router.push("/login")
      return
    }

    setSaving(true)
    try {
      const method = isSaved ? "DELETE" : "POST"
      await apiFetch(`/api/events/${event.id}/save`, {
        method,
      })

      setIsSaved(!isSaved)
      toast({
        title: isSaved ? "Event removed" : "Event saved",
        description: isSaved ? "Event removed from your saved list" : "Event added to your saved events",
      })
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }
  const handleLayoutUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF) or PDF file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('layout', file)

      const updatedEvent = await apiFetch<any>(`/api/events/${event.id}/layout`, {
        method: 'PUT',
        body: formData,
        auth: true,
      })
      if (updatedEvent != null) {

        // Update the event state with the new layout
        setEvent((prev: any) => ({
          ...prev,
          layoutPlan: updatedEvent.layoutPlan
        }))

        toast({
          title: "Success",
          description: "Layout plan updated successfully",
        })
        // Clear the file input
        e.target.value = ''
      } else {
        throw new Error('Failed to update layout plan')
      }
    } catch (error) {
      console.error('Error updating layout plan:', error)
      toast({
        title: "Error",
        description: "Failed to update layout plan",
        variant: "destructive",
      })
    }
  }
  const handleDeleteExhibitor = async (exhibitorId: string) => {
    if (!confirm("Are you sure you want to remove this exhibitor?")) return

    try {
      const response = await fetch(`/api/events/${event.id}/exhibitors/${exhibitorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setEvent((prev: any) => ({
          ...prev,
          exhibitorBooths: prev.exhibitorBooths.filter((booth: any) => booth.id !== exhibitorId),
        }))
        toast({
          title: "Success",
          description: "Exhibitor removed successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting exhibitor:", error)
      toast({
        title: "Error",
        description: "Failed to remove exhibitor",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSpaceCost = async (spaceId: string) => {
    try {
      const response = await fetch(`/api/events/${event.id}/exhibition-spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSpaceData),
      })

      if (response.ok) {
        const updatedSpace = await response.json()
        setEvent((prev: any) => ({
          ...prev,
          exhibitionSpaces: prev.exhibitionSpaces.map((space: any) => (space.id === spaceId ? updatedSpace : space)),
        }))
        setEditingSpaceId(null)
        setEditingSpaceData({})
        toast({
          title: "Success",
          description: "Space cost updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating space cost:", error)
      toast({
        title: "Error",
        description: "Failed to update space cost",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm("Are you sure you want to remove this speaker?")) return

    try {
      const response = await fetch(`/api/events/${event.id}/speakers/${speakerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setEvent((prev: any) => ({
          ...prev,
          speakerSessions: prev.speakerSessions.filter((session: any) => session.id !== speakerId),
        }))
        toast({
          title: "Success",
          description: "Speaker removed successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting speaker:", error)
      toast({
        title: "Error",
        description: "Failed to remove speaker",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLayout = async () => {
    if (!confirm("Are you sure you want to delete the layout plan?")) return

    try {
      await apiFetch(`/api/events/${event.id}/layout`, {
        method: "DELETE",
        auth: true,
      })
      // Update the event state to remove layout plan
      setEvent((prev: any) => ({
        ...prev,
        layoutPlan: null
      }))
      toast({
        title: "Success",
        description: "Layout plan removed successfully",
      })
    } catch (error) {
      console.error("Error deleting layout:", error)
      toast({
        title: "Error",
        description: "Failed to delete layout plan",
        variant: "destructive",
      })
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading event: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Event not found</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="max-w-7xl bg-gray-50 py-0 mx-10">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-10">
          <EventHero event={event} />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Tabs defaultValue="about" className="w-full">
              <div className="bg-white rounded-lg mb-6 shadow-sm border border-gray-200">
                <TabsList className="grid w-full grid-cols-9 h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="about"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="exhibitors"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Exhibitors
                  </TabsTrigger>
                  <TabsTrigger
                    value="space-cost"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Space Cost
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Layout Plan
                  </TabsTrigger>
                  <TabsTrigger
                    value="brochure"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Brochure
                  </TabsTrigger>
                  <TabsTrigger
                    value="venue"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Venue
                  </TabsTrigger>
                  <TabsTrigger
                    value="speakers"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Speakers
                  </TabsTrigger>
                  <TabsTrigger
                    value="organizer"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-4 text-sm font-medium"
                  >
                    Organizer
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>About the Event</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(editingSection === "about" ? null : "about")}
                        >
                          {editingSection === "about" ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        {editingSection === "about" && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/events/${event.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ description: aboutText }),
                                })

                                if (res.ok) {
                                  setEvent((prev: any) => ({ ...prev, description: aboutText }))
                                  toast({ title: "Saved", description: "About section updated" })
                                  setEditingSection(null)
                                }
                              } catch (err) {
                                console.error(err)
                                toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
                              }
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSection === "about" ? (
                      <Textarea
                        className="w-full p-2 border rounded"
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        rows={5}
                      />
                    ) : (
                      <p className="text-gray-700 mb-4 leading-relaxed">{aboutText}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-blue-700">Listed In</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTags(!editingTags)}>
                          {editingTags ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        {editingTags && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const newTags = tagsText
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter(Boolean)

                                const res = await fetch(`/api/events/${event.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tags: newTags }),
                                })

                                if (res.ok) {
                                  setEvent((prev: any) => ({ ...prev, tags: newTags }))
                                  setEditingTags(false)
                                  toast({ title: "Saved", description: "Tags updated successfully" })
                                }
                              } catch (err) {
                                console.error(err)
                                toast({ title: "Error", description: "Failed to save tags", variant: "destructive" })
                              }
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingTags ? (
                      <Textarea
                        className="w-full p-2 border rounded"
                        value={tagsText}
                        onChange={(e) => setTagsText(e.target.value)}
                        placeholder="Enter tags separated by commas"
                        rows={2}
                      />
                    ) : event.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No tags available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="exhibitors">
                {loading ? (
                  <div className="py-12 flex justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading exhibitors...</p>
                    </div>
                  </div>
                ) : event ? (
                  <ExhibitorsTab eventId={event.id} />
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <p>Event not found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="space-cost">
                <Card>
                  <CardHeader>
                    <CardTitle>Exhibition Space Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.exhibitionSpaces?.length > 0 ? (
                      event.exhibitionSpaces.map((space: any) => (
                        <div key={space.id} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                          {editingSpaceId === space.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Base Price</label>
                                <Input
                                  type="number"
                                  value={editingSpaceData.basePrice ?? space.basePrice}
                                  onChange={(e) =>
                                    setEditingSpaceData({
                                      ...editingSpaceData,
                                      basePrice: Number.parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Price per {space.unit}</label>
                                <Input
                                  type="number"
                                  value={editingSpaceData.pricePerSqm ?? space.pricePerSqm}
                                  onChange={(e) =>
                                    setEditingSpaceData({
                                      ...editingSpaceData,
                                      pricePerSqm: Number.parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleUpdateSpaceCost(space.id)}>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSpaceId(null)
                                    setEditingSpaceData({})
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{space.name}</span>
                                <p className="text-sm text-gray-600">{space.description}</p>
                                <p className="text-xs text-gray-500">
                                  Minimum area: {space.minArea} {space.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <span className="font-bold text-lg text-blue-600">
                                    {event.currency} {space.basePrice.toLocaleString()}
                                  </span>
                                  {space.pricePerSqm > 0 && (
                                    <p className="text-sm text-gray-600">
                                      + {event.currency} {space.pricePerSqm}/{space.unit}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSpaceId(space.id)
                                    setEditingSpaceData({
                                      basePrice: space.basePrice,
                                      pricePerSqm: space.pricePerSqm,
                                    })
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No exhibition space information available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Layout Plan</span>
                      <div className="flex gap-2">
                        {/* Update Layout Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('layout-upload')?.click()}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                        {/* Hidden file input */}
                        <input
                          id="layout-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleLayoutUpdate}
                        />
                        {/* Delete Layout Button */}
                        <Button variant="destructive" size="sm" onClick={handleDeleteLayout}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center overflow-hidden">
                      {event?.layoutPlan ? (
                        event.layoutPlan.startsWith('/uploads/') ? (
                          <Image
                            src={event.layoutPlan}
                            alt="Event Layout Plan"
                            width={800}
                            height={600}
                            className="object-contain rounded-lg"
                            onError={(e) => {
                              console.error('Error loading image:', event.layoutPlan)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : event.layoutPlan.startsWith('http') ? (
                          <Image
                            src={event.layoutPlan}
                            alt="Event Layout Plan"
                            width={800}
                            height={600}
                            className="object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <p className="text-gray-500 mb-2">Layout plan available</p>
                            <Button asChild>
                              <a href={event.layoutPlan} target="_blank" rel="noopener noreferrer">
                                View Layout Plan
                              </a>
                            </Button>
                          </div>
                        )
                      ) : (
                        <p className="text-gray-500">No layout plan available</p>
                      )}
                    </div>

                    {/* Debug information - you can remove this in production */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="brochure">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Brochure</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('brochure-upload')?.click()}
                          disabled={updatingBrochure}
                        >
                          {updatingBrochure ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                          ) : (
                            <Edit2 className="w-4 h-4 mr-2" />
                          )}
                          {updatingBrochure ? "Updating..." : "Update"}
                        </Button>
                        <input
                          id="brochure-upload"
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleBrochureUpdate}
                        />
                        {event?.brochure && (
                          <Button variant="destructive" size="sm" onClick={handleDeleteBrochure}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event?.brochure ? (
                        <>
                          {/* Simple PDF Viewer */}
                          <div className="bg-gray-100 rounded-lg border border-gray-300 min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center p-3 bg-white border-b">
                              <span className="text-sm font-medium">Event Brochure</span>
                              <div className="flex gap-2">
                                {/* <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadBrochure(event.id)}
                  >
                    Download PDF
                  </Button> */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(event.brochure, '_blank')}
                                >
                                  Open Full Screen
                                </Button>
                              </div>
                            </div>

                            {/* PDF Display */}
                            <div className="flex-1 p-4">
                              <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(event.brochure)}&embedded=true`}
                                className="w-full h-96 border-0"
                                title="PDF Brochure"
                              />
                              <div className="text-center mt-4">
                                <p className="text-sm text-gray-600">
                                  If the PDF doesn't load, use the buttons above to download or open in a new tab.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-100 h-96 rounded-lg flex flex-col items-center justify-center">
                          <p className="text-gray-600 mb-4">No brochure available</p>
                          <Button
                            onClick={() => document.getElementById('brochure-upload')?.click()}
                            disabled={updatingBrochure}
                          >
                            {updatingBrochure ? "Uploading..." : "Upload Brochure"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="venue">
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Information</CardTitle>
                  </CardHeader>
                  <CardContent
                    className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => router.push(`/venue/${event.venue?.id}`)}
                  >
                    <div className="space-y-4">
                      {/* Venue Header */}
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                          {event.venue?.company}
                        </h4>
                        {/* Bio / Description */}
                        {event.venue?.bio && (
                          <p className="text-gray-600 text-sm">{event.venue.bio}</p>
                        )}
                        <p className="text-gray-500">{event.venue?.location}</p>
                        {event.venue?.website && (
                          <a
                            href={event.venue.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking link
                          >
                            {event.venue.website}
                          </a>
                        )}
                      </div>

                      {/* Amenities */}
                      {event.venue?.amenities?.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-2">Amenities</h5>
                          <div className="flex flex-wrap gap-2">
                            {event.venue.amenities.map((amenity: any, idx: any) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="speakers">
                <Card>
                  <CardHeader>
                    <CardTitle>Speakers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.speakerSessions?.length > 0 ? (
                      event.speakerSessions.map((session: any) => (
                        <div
                          key={session.id}
                          className="flex justify-between items-start p-4 bg-white rounded-lg border shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => router.push(`/speakers/${session.speaker?.id}`)}
                        >
                          <div className="flex gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={session.speaker?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{session.speaker?.firstName?.charAt(0) || "S"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold hover:text-blue-600 transition-colors">
                                {session.speaker?.firstName || "Speaker"}
                              </h4>
                              <p className="text-sm text-gray-600">{session.title}</p>
                              <p className="text-xs text-gray-500">{session.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigation when clicking delete
                              handleDeleteSpeaker(session.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No speakers scheduled yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="organizer">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Organizer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      onClick={() => router.push(`/organizer/${event.organizer?.id}`)}
                    >
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={event.organizer?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-lg">
                          {event.organizer?.company}
                          {/* {event.organizer?.firstName?.charAt(0) || "O"} */}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                          {event.organizer?.company || event.organizer?.firstName}
                        </h4>
                        <p className="text-gray-600 mb-3">Professional event organizer and manager</p>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-green-600" />
                            <span>{event.organizer?.email || "Contact via platform"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
