"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Shield, Calendar } from "lucide-react"
import { toast } from "sonner"
import AdminDashboard from "../sidebar"

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

export default function SubAdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem("adminUser")
      const adminToken = localStorage.getItem("adminToken")

      if (userData && adminToken) {
        const user = JSON.parse(userData)
        // Check if user is sub-admin
        if (user.role === "SUB_ADMIN") {
          setUser(user)
        } else {
          router.push("/sub-admin/login")
        }
      } else {
        router.push("/sub-admin/login")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/sub-admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage
      localStorage.removeItem("adminUser")
      localStorage.removeItem("adminToken")
      
      toast.success("Logged out successfully")
      router.push("/sub-admin/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminDashboard  />
     
    </div>
  )
}