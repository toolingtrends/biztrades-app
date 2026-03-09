"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import {
  Megaphone,
  Users,
  Target,
  CreditCard,
  CheckCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  Music,
  Car,
  Home,
  Utensils,
  ShoppingBag,
  Plane,
  Dumbbell,
  Palette,
  Code,
  Stethoscope,
  Star,
  Loader2,
} from "lucide-react"

interface Event {
  id: string
  title: string
  date: string
  location: string
  status: string
  category: string
}

interface Promotion {
  id: string
  eventId: string
  event: {
    id: string
    title: string
    date: string
    location: string
    status: string
  } | null
  packageType: string
  targetCategories: string[]
  status: string
  amount: number
  duration: number
  startDate: string
  endDate: string
  impressions: number
  clicks: number
  conversions: number
  createdAt: string
}

interface PromotionPackage {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  userCount: number
  categories: string[]
  duration: string
  recommended?: boolean
}

interface CategoryFilter {
  id: string
  name: string
  icon: any
  userCount: number
  avgEngagement: number
  color: string
}

export default function EventPromotion({ eventId }: { eventId: string }) {
  const { toast } = useToast()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPackage, setSelectedPackage] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [promotionPackages, setPromotionPackages] = useState<PromotionPackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)

  // State for API data
  const [event, setEvent] = useState<Event | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])

  // User categories with engagement data
  const userCategories: CategoryFilter[] = [
    {
      id: "technology",
      name: "Technology & IT",
      icon: Code,
      userCount: 12500,
      avgEngagement: 78,
      color: "bg-blue-500",
    },
    {
      id: "business",
      name: "Business & Finance",
      icon: Briefcase,
      userCount: 8900,
      avgEngagement: 82,
      color: "bg-green-500",
    },
    {
      id: "healthcare",
      name: "Healthcare & Medical",
      icon: Stethoscope,
      userCount: 6700,
      avgEngagement: 85,
      color: "bg-red-500",
    },
    {
      id: "education",
      name: "Education & Training",
      icon: GraduationCap,
      userCount: 9200,
      avgEngagement: 76,
      color: "bg-purple-500",
    },
    {
      id: "arts",
      name: "Arts & Culture",
      icon: Palette,
      userCount: 4300,
      avgEngagement: 88,
      color: "bg-pink-500",
    },
    {
      id: "sports",
      name: "Sports & Fitness",
      icon: Dumbbell,
      userCount: 7800,
      avgEngagement: 79,
      color: "bg-orange-500",
    },
    {
      id: "food",
      name: "Food & Beverage",
      icon: Utensils,
      userCount: 5600,
      avgEngagement: 83,
      color: "bg-yellow-500",
    },
    {
      id: "travel",
      name: "Travel & Tourism",
      icon: Plane,
      userCount: 6100,
      avgEngagement: 81,
      color: "bg-indigo-500",
    },
    {
      id: "automotive",
      name: "Automotive",
      icon: Car,
      userCount: 3900,
      avgEngagement: 74,
      color: "bg-gray-500",
    },
    {
      id: "real-estate",
      name: "Real Estate",
      icon: Home,
      userCount: 4700,
      avgEngagement: 77,
      color: "bg-teal-500",
    },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: Music,
      userCount: 8200,
      avgEngagement: 86,
      color: "bg-violet-500",
    },
    {
      id: "retail",
      name: "Retail & Shopping",
      icon: ShoppingBag,
      userCount: 7300,
      avgEngagement: 80,
      color: "bg-emerald-500",
    },
  ]

  useEffect(() => {
    fetchPromotionData()
    fetchPromotionPackages()
  }, [eventId])

  const fetchPromotionPackages = async () => {
    try {
      setPackagesLoading(true)
      const data = await apiFetch<{ packages: any[] }>("/api/promotion-packages?userType=ORGANIZER", {
        auth: false,
      })

      // Transform API response to match component structure
      const transformedPackages = data.packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        features: pkg.features,
        userCount: pkg.userCount,
        categories: ["selected"], // You can customize this based on your needs
        duration: `${pkg.duration} days`,
        recommended: pkg.isRecommended,
      }))

      setPromotionPackages(transformedPackages)
    } catch (error) {
      console.error("Error fetching promotion packages:", error)
      toast({
        title: "Error",
        description: "Failed to load promotion packages",
        variant: "destructive",
      })
    } finally {
      setPackagesLoading(false)
    }
  }

  const fetchPromotionData = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<{ event: Event; promotions: Promotion[] }>(
        `/api/events/${eventId}/promotions`,
        { auth: false },
      )
      setEvent(data.event)
      setPromotions(data.promotions || [])
    } catch (error) {
      console.error("Error fetching promotion data:", error)
      toast({
        title: "Error",
        description: "Failed to load promotion data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPromotion = async () => {
    const selectedPackageData = promotionPackages.find((p) => p.id === selectedPackage)
    if (!selectedPackageData) return

    try {
      setCreating(true)
      await apiFetch(`/api/events/${eventId}/promotions`, {
        method: "POST",
        body: {
          packageType: selectedPackageData.id,
          targetCategories: selectedCategories,
          amount: selectedPackageData.price,
          duration: Number.parseInt(selectedPackageData.duration.split(" ")[0]),
        },
      })

      toast({
        title: "Success",
        description: "Promotion campaign created successfully!",
      })

      setIsPaymentDialogOpen(false)
      setSelectedCategories([])
      setSelectedPackage("")
      fetchPromotionData()
    } catch (error) {
      console.error("Error creating promotion:", error)
      toast({
        title: "Error",
        description: "Failed to create promotion campaign",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const calculateEstimatedReach = () => {
    if (selectedCategories.length === 0) return 0
    return selectedCategories.reduce((total, categoryId) => {
      const category = userCategories.find((c) => c.id === categoryId)
      return total + (category?.userCount || 0)
    }, 0)
  }

  const calculateEstimatedEngagement = () => {
    if (selectedCategories.length === 0) return 0
    const totalEngagement = selectedCategories.reduce((total, categoryId) => {
      const category = userCategories.find((c) => c.id === categoryId)
      return total + (category?.avgEngagement || 0)
    }, 0)
    return Math.round(totalEngagement / selectedCategories.length)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId)
    setIsPaymentDialogOpen(true)
  }

  const selectedPackageData = promotionPackages.find((p) => p.id === selectedPackage)

  if (loading || packagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Event not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promote Your Event</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="font-semibold">{event.title}</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            <Badge variant="outline">{event.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Users className="w-4 h-4 mr-1" />
            {userCategories.reduce((total, cat) => total + cat.userCount, 0).toLocaleString()} Platform Users
          </Badge>
        </div>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target User Categories
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select categories that match your event audience. Each category shows user count and engagement rate.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCategories.includes(category.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </div>
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">{category.userCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Engagement:</span>
                    <span className="font-medium">{category.avgEngagement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Estimated Reach</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Users:</span>
                  <div className="text-2xl font-bold text-blue-600">{calculateEstimatedReach().toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Avg. Engagement:</span>
                  <div className="text-2xl font-bold text-green-600">{calculateEstimatedEngagement()}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Expected Registrations:</span>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(calculateEstimatedReach() * (calculateEstimatedEngagement() / 100) * 0.15)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promotion Packages */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Choose Promotion Package
            </CardTitle>
            <p className="text-sm text-gray-600">Select a package that fits your budget and reach requirements</p>
          </CardHeader>
          <CardContent>
            {promotionPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No promotion packages available at the moment.</p>
                <p className="text-sm mt-2">Please check back later or contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotionPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative p-6 border-2 rounded-lg ${
                      pkg.recommended ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    {pkg.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{pkg.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      <div className="mt-3">
                        <span className="text-3xl font-bold text-blue-600">₹{pkg.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">/{pkg.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reach:</span>
                        <span className="font-medium">{pkg.userCount.toLocaleString()}+ users</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{pkg.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      variant={pkg.recommended ? "default" : "outline"}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Select Package
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Promotion Purchase</DialogTitle>
            <DialogDescription>
              Review your selection and complete the payment to start promoting your event
            </DialogDescription>
          </DialogHeader>

          {selectedPackageData && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-medium">{selectedPackageData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Event:</span>
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{selectedPackageData.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Categories:</span>
                    <span className="font-medium">{selectedCategories.length} selected</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{selectedPackageData.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={createPromotion} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
