"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import MessagesCenter from "@/app/organizer-dashboard/messages-center"
import EventPromotion from "@/app/organizer-dashboard/event-promotion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Package,
  Settings,
  BarChart3,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Twitter,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "@/contexts/dashboard-context"

import CompanyInfo from "./company-info"
import EventParticipation from "./event-participation"
import ProductListing from "./product-listing"
import LeadManagement from "./lead-management"
import AppointmentScheduling from "./appointment-scheduling"
import AnalyticsReports from "./analytics-reports"
import PromotionsMarketing from "./promotions-marketing"
import { ExhibitorSettings } from "./settings"
import { ConnectionsSection } from "@/app/dashboard/connections-section"
import { HelpSupport } from "@/components/HelpSupport"
import { FollowManagement } from "./follow-management"
import { ActiveEventsCard } from "./TotalExhibitorEvent"
import { FollowersCountCard } from "./FollowersCountCard"
import { AppointmentsCountCard } from "./AppointmentsCountCard"
import ActivePromotions from "./active-promotion"
import { ExhibitorHelpSupport } from "./help-support"
import ViewFeedback from "./view-feedback"

interface ExhibitorData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  bio?: string
  website?: string
  twitter?: string
  location?: string
  jobTitle?: string
  totalEvents: number
  activeEvents: number
  totalProducts: number
  totalLeads: number
  pendingLeads: number
  profileViews: number
  upcomingAppointments: number
}

interface UserDashboardProps {
  userId: string
}

export function ExhibitorLayout({ userId }: UserDashboardProps) {
  const [exhibitor, setExhibitor] = useState<ExhibitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { activeSection, setActiveSection } = useDashboard()
  const [appointmentCount, setAppointmentCount] = useState<number>(0)
  const [openMenus, setOpenMenus] = useState<string[]>([
  "main", "leadManagement", "marketingCampaigns", "analytics", "network", "feedback"
])

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (session?.user.id !== userId && session?.user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this dashboard.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchExhibitorData()
  }, [userId, status, session, router, toast])

  useEffect(() => {
    // Set company info as default active section when component mounts
    if (!activeSection) {
      setActiveSection("company")
    }
  }, [activeSection, setActiveSection])

  // Function to fetch product count
  const fetchProductCount = async (exhibitorId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/exhibitors/${exhibitorId}/products`)
      if (response.ok) {
        const data = await response.json()
        // This will return the actual count from products array length
        return data.products?.length || 0
      }
      return 0
    } catch (error) {
      console.error("Error fetching product count:", error)
      return 0
    }
  }

  const fetchExhibitorData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user data and product count in parallel
      const [userResponse, productCount] = await Promise.all([
        fetch(`/api/users/${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetchProductCount(userId)
      ])

      if (!userResponse.ok) {
        if (userResponse.status === 404) throw new Error("User not found")
        if (userResponse.status === 403) throw new Error("Access denied")
        throw new Error("Failed to fetch user data")
      }

      const userData = await userResponse.json()
      
      // Combine user data with product count
      setExhibitor({
        ...userData.user,
        totalProducts: productCount, // This will now show the actual count (3)
        // Set default values for other fields if not provided
        totalEvents: userData.user.totalEvents || 0,
        activeEvents: userData.user.activeEvents || 0,
        totalLeads: userData.user.totalLeads || 0,
        pendingLeads: userData.user.pendingLeads || 0,
        profileViews: userData.user.profileViews || 0,
        upcomingAppointments: userData.user.upcomingAppointments || 0
      })
      
      setAppointmentCount(Number(userData.user.upcomingAppointments) || 0)
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError(err instanceof Error ? err.message : "An error occurred")

      if (err instanceof Error && (err.message === "Access denied" || err.message === "User not found")) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        })
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => (prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]))
  }

  const handleUpdate = async (updates: Partial<any>) => {
    try {
      const res = await fetch(`/api/exhibitors/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const data = await res.json()

      if (data.success) {
        setExhibitor((prev: any) => ({ ...prev, ...updates }))
      }
    } catch (error) {
      console.error("Error updating exhibitor:", error)
    }
  }

  // Helper function for menu item styling
  const menuItemClass = (sectionId: string) => {
    return `cursor-pointer pl-3 py-2 text-sm rounded-md transition-colors w-full text-left ${
      activeSection === sectionId 
        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700 font-medium" 
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"
    }`
  }

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchExhibitorData} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    if (!exhibitor) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No exhibitor data found.</p>
            </CardContent>
          </Card>
        </div>
      )
    }
    return renderContent()
  }

  const renderContent = () => {
    if (!exhibitor) return null
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exhibitor Dashboard</h1>
              <p className="text-gray-600">Welcome back, {exhibitor.firstName}!</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                {/* <CardContent>
                  <ActiveEventsCard exhibitorId={exhibitor.id} />
                  <p className="text-xs text-muted-foreground">Active Events</p>
                </CardContent> */}
                 <CardContent>
                  <div className="text-2xl font-bold">{exhibitor.activeEvents}</div>
                 
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exhibitor.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">{exhibitor.profileViews || 0} total views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <FollowersCountCard exhibitorId={exhibitor.id} />
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <AppointmentsCountCard exhibitorId={exhibitor.id} />
                  <p className="text-xs text-muted-foreground">Total Appointments</p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={exhibitor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">
                      {exhibitor.firstName[0]}
                      {exhibitor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {exhibitor.firstName} {exhibitor.lastName}
                    </h3>
                    {exhibitor.jobTitle && (
                      <p className="text-gray-600 flex items-center mt-1">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {exhibitor.jobTitle}
                      </p>
                    )}
                    {exhibitor.location && (
                      <p className="text-gray-600 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        {exhibitor.location}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {exhibitor.email && (
                        <a
                          href={`mailto:${exhibitor.email}`}
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </a>
                      )}
                      {exhibitor.phone && (
                        <a
                          href={`tel:${exhibitor.phone}`}
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </a>
                      )}
                      {exhibitor.website && (
                        <a
                          href={exhibitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                      {exhibitor.twitter && (
                        <a
                          href={`https://twitter.com/${exhibitor.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Twitter className="h-4 w-4 mr-1" />
                          Twitter
                        </a>
                      )}
                    </div>
                    {exhibitor.bio && <p className="text-gray-700 mt-3">{exhibitor.bio}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "company":
        return <CompanyInfo exhibitorId={exhibitor.id} onUpdate={handleUpdate} exhibitorData={exhibitor} />
      case "events":
        return <EventParticipation exhibitorId={exhibitor.id} />
      case "products":
        return <ProductListing exhibitorId={exhibitor.id} />
      case "messages":
        return <MessagesCenter organizerId={exhibitor.id} />
      case "connection":
        return <ConnectionsSection userId={exhibitor.id} />
      case "follow":
        return <FollowManagement userId={exhibitor.id} />
      case "appointments":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Add any appointment stats cards here if needed */}
            </div>
            <AppointmentScheduling
              exhibitorId={exhibitor.id}
              onCountChange={setAppointmentCount}
            />
          </div>
        )
  //       case "submit-feedback":
  // return <SubmitFeedback exhibitorId={exhibitor.id} />
case "view-feedback":
  return <ViewFeedback exhibitorId={exhibitor.id} />


      case "analytics":
        return <AnalyticsReports exhibitorId={exhibitor.id} />
      case "promotions":
        return <PromotionsMarketing exhibitorId={exhibitor.id} />
      case "active-promotions":
        return <ActivePromotions exhibitorId={exhibitor.id} />
      case "help":
        return <ExhibitorHelpSupport />
      case "settings":
        return <ExhibitorSettings />
      default:
        return <CompanyInfo exhibitorId={exhibitor.id} onUpdate={handleUpdate} exhibitorData={exhibitor} />
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - always visible on md+, toggled on mobile */}
      <aside className={`
        fixed left-0 top-0 md:relative
        w-64 min-w-[16rem] min-h-screen bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        flex flex-col flex-shrink-0 shadow-sm
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exhibitor Menu</h2>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {/* Main Dropdown */}
          <div className="mb-4">
            <button
              className="flex items-center justify-between w-full py-2 font-medium text-sm text-gray-700 hover:text-gray-900"
              onClick={() => toggleMenu("main")}
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={16} />
                Main
              </span>
              {openMenus.includes("main") ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {openMenus.includes("main") && (
              <div className="ml-2 mt-2 space-y-1">
                <button
                  onClick={() => setActiveSection("overview")}
                  className={menuItemClass("overview")}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection("company")}
                  className={menuItemClass("company")}
                >
                  Company
                </button>
              </div>
            )}
          </div>

{/* Feedback Dropdown */}
<div className="mb-4">
  <button
    className="flex items-center justify-between w-full py-2 font-medium text-sm text-gray-700 hover:text-gray-900"
    onClick={() => toggleMenu("feedback")}
  >
    <span className="flex items-center gap-2">
      <Star size={16} />
      Feedback
    </span>
    {openMenus.includes("feedback") ? (
      <ChevronDown size={16} />
    ) : (
      <ChevronRight size={16} />
    )}
  </button>
  {openMenus.includes("feedback") && (
    <div className="ml-2 mt-2 space-y-1">
      <button
        onClick={() => setActiveSection("view-feedback")}
        className={menuItemClass("view-feedback")}
      >
        View Feedback
      </button>
    </div>
  )}
</div>


          {/* Lead Management Dropdown */}
          <div className="mb-4">
            <button
              className="flex items-center justify-between w-full py-2 font-medium text-sm text-gray-700 hover:text-gray-900"
              onClick={() => toggleMenu("leadManagement")}
            >
              <span className="flex items-center gap-2">
                <Users size={16} />
                Event & Products
              </span>
              {openMenus.includes("leadManagement") ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {openMenus.includes("leadManagement") && (
              <div className="ml-2 mt-2 space-y-1">
                <button
                  onClick={() => setActiveSection("events")}
                  className={menuItemClass("events")}
                >
                  Events
                </button>
                <button
                  onClick={() => setActiveSection("products")}
                  className={menuItemClass("products")}
                >
                  Products
                </button>
              </div>
            )}
          </div>

          {/* Marketing Campaigns Dropdown */}
          <div className="mb-4">
            <button
              className="flex items-center justify-between w-full py-2 font-medium text-sm text-gray-700 hover:text-gray-900"
              onClick={() => toggleMenu("marketingCampaigns")}
            >
              <span className="flex items-center gap-2">
                <Star size={16} />
                Marketing Campaigns
              </span>
              {openMenus.includes("marketingCampaigns") ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {openMenus.includes("marketingCampaigns") && (
              <div className="ml-2 mt-2 space-y-1">
                <button
                  onClick={() => setActiveSection("promotions")}
                  className={menuItemClass("promotions")}
                >
                  Promotion
                </button>
                <button
                  onClick={() => setActiveSection("active-promotions")}
                  className={menuItemClass("active-promotions")}
                >
                  Active Promotion
                </button>
              </div>
            )}
          </div>

          {/* Network Dropdown */}
          <div className="mb-4">
            <button
              className="flex items-center justify-between w-full py-2 font-medium text-sm text-gray-700 hover:text-gray-900"
              onClick={() => toggleMenu("network")}
            >
              <span className="flex items-center gap-2">
                <Users size={16} />
                Network
              </span>
              {openMenus.includes("network") ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {openMenus.includes("network") && (
              <div className="ml-2 mt-2 space-y-1">
                <button
                  onClick={() => setActiveSection("follow")}
                  className={menuItemClass("follow")}
                >
                  Follow
                </button>
                <button
                  onClick={() => setActiveSection("messages")}
                  className={menuItemClass("messages")}
                >
                  Messages
                </button>
                <button
                  onClick={() => setActiveSection("connection")}
                  className={menuItemClass("connection")}
                >
                  Connection
                </button>
                <button
                  onClick={() => setActiveSection("appointments")}
                  className={menuItemClass("appointments")}
                >
                  Appointments
                </button>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <button
            onClick={() => setActiveSection("help")}
            className={`flex items-center w-full py-2 gap-2 font-medium text-sm rounded-md transition-colors ${
              activeSection === "help" 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <HelpCircle size={16} />
            Help & Support
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveSection("settings")}
            className={`flex items-center w-full py-2 gap-2 font-medium text-sm rounded-md transition-colors mt-1 ${
              activeSection === "settings" 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Settings size={16} />
            Settings
          </button>

          {/* Logout */}
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-500 hover:bg-red-600 text-white mt-8"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="w-9" />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Dynamic Content */}
            <div className="">
              {renderMainContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}