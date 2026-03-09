"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AdminDashboard from "./sidebar"
import Navbar from "./navbar"
import { NameBanner } from "./NameBanner"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const role = (session.user as any).role ?? (session.user as any).adminType
  const userRole: "SUPER_ADMIN" | "SUB_ADMIN" =
    role === "SUPER_ADMIN" || (session.user as any).adminType === "SUPER_ADMIN"
      ? "SUPER_ADMIN"
      : "SUB_ADMIN"
  const userPermissions = ((session.user as any).permissions as string[]) || []
  const isSuperAdmin = userRole === "SUPER_ADMIN"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <NameBanner
        name={session.user.name || "Admin"}
        designation={isSuperAdmin ? "Super Administrator" : "Sub Administrator"}
        bannerImage="/admin-banner.jpg"
      />
      <AdminDashboard userRole={userRole} userPermissions={userPermissions} />
    </div>
  )
}
