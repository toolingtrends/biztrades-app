"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, UserPlus, UserCheck, UserX } from "lucide-react"

interface Connection {
  id: string
  firstName: string
  lastName: string
  jobTitle?: string
  company?: string
  avatar?: string
  mutualConnections?: number
  status: 'connected' | 'pending' | 'request_received'
  connectionId: string // Add this to match the backend response
}

interface ConnectionsSectionProps {
  userId: string
}

export function ConnectionsSection({ userId }: ConnectionsSectionProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections')
  const [showFindPeople, setShowFindPeople] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [userId])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}/connections`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch connections")
      }

      const data = await response.json()
      setConnections(data.connections)
    } catch (err) {
      console.error("Error fetching connections:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

 const handleConnectionAction = async (targetId: string, action: 'accept' | 'reject' | 'connect' | 'cancel') => {
  try {
    if (action === 'connect') {
      // For connect action, use the POST endpoint
      const response = await fetch(`/api/users/${userId}/connections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: targetId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send connection request`)
      }

      const data = await response.json()
      // Add the new pending connection to the list
      setConnections(prev => [...prev, data.connection])
      setSearchResults(prev => prev.filter(user => user.id !== targetId))
    } else {
      // For other actions, find the connection by connectionId
      const connection = connections.find(conn => 
        conn.connectionId === targetId || conn.id === targetId
      )
      
      if (!connection) {
        throw new Error("Connection not found")
      }

      const connectionId = connection.connectionId
      
      const response = await fetch(`/api/users/${userId}/connections/${connectionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} connection`)
      }

      // Update the connection status locally
      if (action === 'accept' || action === 'reject') {
        // Remove from list when accepting or rejecting a request
        setConnections(prev => prev.filter(conn => 
          conn.connectionId !== connectionId && conn.id !== connectionId
        ))
      } else if (action === 'cancel') {
        // Remove from list when canceling a request
        setConnections(prev => prev.filter(conn => 
          conn.connectionId !== connectionId && conn.id !== connectionId
        ))
      }
    }
  } catch (err) {
    console.error(`Error performing ${action} on connection:`, err)
    setError(err instanceof Error ? err.message : "An error occurred")
  }
}

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        // Filter out users who are already connected or have pending requests
        const filteredResults = data.users.filter((user: any) => 
          !connections.some(conn => 
            (conn.firstName === user.firstName && conn.lastName === user.lastName) ||
            conn.id === user.id
          )
        )
        setSearchResults(filteredResults)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const filteredConnections = connections.filter(
  (connection) =>
    (connection.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.company?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (activeTab === 'connections' ? 
      connection.status === 'connected' : 
      connection.status === 'request_received')
)

// Get pending connections (outgoing requests)
const pendingConnections = connections.filter(conn => 
  conn.status === 'pending' && activeTab === 'connections'
) 

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchConnections}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* <h1 className="text-3xl font-bold text-gray-900">Connections</h1> */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search connections..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowFindPeople(!showFindPeople)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {showFindPeople ? "Back to Connections" : "Find People"}
          </Button>
        </div>
      </div>

      {showFindPeople ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Find People to Connect With</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, company, or job title..."
                className="pl-10"
                onChange={(e) => searchUsers(e.target.value)}
              />
            </div>
          </div>

          {searchLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mb-1">
                      {user.firstName} {user.lastName}
                    </h3>
                    {user.jobTitle && <p className="text-sm text-gray-600 mb-1">{user.jobTitle}</p>}
                    {user.company && <p className="text-sm text-gray-500 mb-4">{user.company}</p>}
                    <Button 
                      size="sm" 
                      onClick={() => handleConnectionAction(user.id, 'connect')}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Search for people to connect with</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tabs for Connections and Requests */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'connections' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('connections')}
            >
              My Connections ({connections.filter(c => c.status === 'connected').length})
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('requests')}
            >
              Connection Requests ({connections.filter(c => c.status === 'request_received').length})
            </button>
          </div>

          {/* Pending Outgoing Requests Section */}
          {activeTab === 'connections' && pendingConnections.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-medium mb-4">Pending Connection Requests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {pendingConnections.map((connection) => (
                  <Card key={connection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {connection.firstName[0]}
                          {connection.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold mb-1">
                        {connection.firstName} {connection.lastName}
                      </h3>
                      {connection.jobTitle && <p className="text-sm text-gray-600 mb-1">{connection.jobTitle}</p>}
                      {connection.company && <p className="text-sm text-gray-500 mb-2">{connection.company}</p>}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleConnectionAction(connection.connectionId || connection.id, 'cancel')}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Cancel Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Main Connections/Requests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.length > 0 ? (
              filteredConnections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {connection.firstName[0]}
                        {connection.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mb-1">
                      {connection.firstName} {connection.lastName}
                    </h3>
                    {connection.jobTitle && <p className="text-sm text-gray-600 mb-1">{connection.jobTitle}</p>}
                    {connection.company && <p className="text-sm text-gray-500 mb-2">{connection.company}</p>}
                    {connection.mutualConnections && (
                      <p className="text-xs text-blue-600 mb-4">{connection.mutualConnections} mutual connections</p>
                    )}
                    <div className="flex gap-2">
                      {activeTab === 'connections' ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            View Profile
                          </Button>
                          <Button size="sm" className="flex-1">
                            <UserCheck className="w-4 h-4 mr-1" />
                            Connected
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleConnectionAction(connection.id, 'accept')}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleConnectionAction(connection.id, 'reject')}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">
                  {activeTab === 'connections' 
                    ? (searchTerm ? "No connections found matching your search." : "No connections found.") 
                    : "No pending connection requests."}
                </p>
                <Button className="mt-4" onClick={() => setShowFindPeople(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find People to Connect
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}