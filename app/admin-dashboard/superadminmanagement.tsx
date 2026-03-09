"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Eye, ArrowLeft } from "lucide-react"
import SubAdminAddPage from "./subadmin-management"
import SubAdminEditPage from "./sub-admin-edit-page"
import SubAdminViewPage from "./sub-admin-view-page"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SubAdmin {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  permissions: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
}

type ViewMode = "list" | "add" | "edit" | "view"

export default function SuperAdminManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null)
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in")
    }
  }, [status, router])

  const fetchSubAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sub-admins')
      
      if (response.status === 401) {
        toast.error("Session expired. Please login again.")
        router.push("/sign-in")
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch sub-admins')
      }
      
      const data = await response.json()
      setSubAdmins(data.subAdmins)
    } catch (error) {
      console.error('Error fetching sub-admins:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load sub-admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchSubAdmins()
    }
  }, [session])

  const handleDeleteSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub-admin?')) return

    try {
      const response = await fetch(`/api/sub-admins/${id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        toast.error("Session expired. Please login again.")
        router.push("/sign-in")
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete sub-admin')
      }

      toast.success('Sub-admin deleted successfully')
      fetchSubAdmins()
    } catch (error) {
      console.error('Error deleting sub-admin:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete sub-admin')
    }
  }

  const handleEditSubAdmin = (subAdmin: SubAdmin) => {
    setSelectedSubAdmin(subAdmin)
    setViewMode("edit")
  }

  const handleViewSubAdmin = (subAdmin: SubAdmin) => {
    setSelectedSubAdmin(subAdmin)
    setViewMode("view")
  }

  const handleAddSuccess = () => {
    setViewMode("list")
    fetchSubAdmins()
    toast.success('Sub-admin created successfully')
  }

  const handleEditSuccess = () => {
    setViewMode("list")
    setSelectedSubAdmin(null)
    fetchSubAdmins()
    toast.success('Sub-admin updated successfully')
  }

  const handleCancel = () => {
    setViewMode("list")
    setSelectedSubAdmin(null)
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      "SUB_ADMIN": "Sub Admin",
      "MODERATOR": "Moderator",
      "SUPPORT": "Support Staff"
    }
    return roleMap[role] || role
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect due to useEffect
  }

  if (viewMode !== "list") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {viewMode === "add" && "Add New Sub Admin"}
              {viewMode === "edit" && "Edit Sub Admin"}
              {viewMode === "view" && "Sub Admin Details"}
            </h1>
            <Button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
          </div>
          
          {viewMode === "add" && (
            <SubAdminAddPage onSuccess={handleAddSuccess} onCancel={handleCancel} />
          )}
          
          {viewMode === "edit" && selectedSubAdmin && (
            <SubAdminEditPage 
              subAdmin={selectedSubAdmin} 
              onSuccess={handleEditSuccess} 
              onCancel={handleCancel} 
            />
          )}
          
          {viewMode === "view" && selectedSubAdmin && (
            <SubAdminViewPage 
              subAdmin={selectedSubAdmin} 
              onCancel={handleCancel} 
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative flex items-center justify-center w-full">
          <div className="w-full h-[4px] rounded-full bg-gradient-to-r from-green-300 to-blue-500" />
          <div className="absolute bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded">
            SUB ADMINS
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SUB ADMINS</h1>
            <p className="text-gray-600">Manage all sub-administrator accounts</p>
          </div>

          <Button
            onClick={() => setViewMode("add")}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Sub Admin
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">All Sub Admins</CardTitle>
            <CardDescription>View and manage all sub-administrator accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
                  <TableHead className="font-semibold text-gray-900 py-3">No</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">User</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Email</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Role</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Phone</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Permissions</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : subAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No sub-admins found. Click "Add New Sub Admin" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  subAdmins.map((subAdmin, index) => (
                    <TableRow key={subAdmin.id} className="border-b hover:bg-gray-50">
                      <TableCell className="py-4 font-medium">{index + 1}</TableCell>
                      <TableCell className="py-4 font-medium">{subAdmin.name}</TableCell>
                      <TableCell className="py-4">{subAdmin.email}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={
                          subAdmin.role === "SUB_ADMIN" 
                            ? "bg-purple-100 text-purple-800"
                            : subAdmin.role === "MODERATOR"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }>
                          {getRoleDisplay(subAdmin.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">{subAdmin.phone || 'N/A'}</TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-xs truncate" title={subAdmin.permissions.join(', ')}>
                          {subAdmin.permissions.length} permissions
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={
                          subAdmin.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {subAdmin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={() => handleViewSubAdmin(subAdmin)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleEditSubAdmin(subAdmin)}
                            title="Edit Sub Admin"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDeleteSubAdmin(subAdmin.id)}
                            title="Delete Sub Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}