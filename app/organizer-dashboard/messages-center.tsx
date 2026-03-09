"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Users,
  MessageCircle,
  CheckCheck,
  Check,
  Loader2,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Connection {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  role: string
  company: string
  jobTitle: string
  lastLogin: string
  isOnline: boolean
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  isRead: boolean
  sender?: {
    firstName: string
    lastName: string
    avatar: string
  }
}

interface Conversation {
  id: string
  contactId: string
  contact?: {
    firstName: string
    lastName: string
    avatar: string
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface MessagesCenterProps {
  organizerId: string
}

export default function MessagesCenter({ organizerId }: MessagesCenterProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [connections, setConnections] = useState<Connection[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null)
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ws = useRef<WebSocket | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // WebSocket connection for real-time updates
// In messages-center.tsx
useEffect(() => {
  const connectWebSocket = () => {
    try {
      // Check if WebSocket is supported
      if (!window.WebSocket) {
        console.warn("WebSocket not supported, using fallback polling");
        setupPolling();
        return;
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      ws.current = new WebSocket(`${wsUrl}?userId=${organizerId}`);

      // Add connection timeout
      const timeout = setTimeout(() => {
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket connection timeout, using fallback");
          setIsOnline(false);
          setupPolling();
        }
      }, 5000);

      ws.current.onopen = () => {
        clearTimeout(timeout);
        console.log("WebSocket connected");
        setIsOnline(true);
      };

      ws.current.onerror = (error) => {
        clearTimeout(timeout);
        console.error("WebSocket error:", error);
        setIsOnline(false);
        // Fallback to polling
        setupPolling();
      };

      ws.current.onclose = () => {
        clearTimeout(timeout);
        console.log("WebSocket disconnected");
        setIsOnline(false);
      };

    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setIsOnline(false);
      setupPolling();
    }
  };

  connectWebSocket();

  return () => {
    if (ws.current) {
      ws.current.close();
    }
  };
}, [organizerId]);

  useEffect(() => {
    fetchConversations()
    fetchConnections()
  }, [organizerId])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact)
      markMessagesAsRead(selectedContact)
    }
  }, [selectedContact])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizers/${organizerId}/messages`)
      if (!response.ok) throw new Error("Failed to fetch conversations")
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${organizerId}/connections`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch connections")
      }

      const data = await response.json()
      setConnections(data.connections || [])
    } catch (err) {
      console.error("Error fetching connections:", err)
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (contactId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizers/${organizerId}/messages?contactId=${contactId}`)
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async (contactId: string) => {
    try {
      const response = await fetch(`/api/organizers/${organizerId}/messages/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactId }),
      })

      if (!response.ok) throw new Error("Failed to mark messages as read")

      // Update local state
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })))
      setConversations(prev =>
        prev.map(conv =>
          conv.contactId === contactId ? { ...conv, unreadCount: 0 } : conv
        )
      )

      // Send read receipt via WebSocket if available
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: "MESSAGES_READ",
          contactId,
          userId: organizerId
        }))
      }
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return

    // Declare tempId outside the try block so it's accessible in catch
    const tempId = Date.now().toString()

    try {
      setSending(true)

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: tempId,
        senderId: organizerId,
        receiverId: selectedContact,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: {
          firstName: "You",
          lastName: "",
          avatar: "/placeholder.svg"
        }
      }

      setMessages(prev => [...prev, optimisticMessage])
      setNewMessage("")

      // Update conversations list optimistically
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv.contactId === selectedContact)
        if (existingConvIndex !== -1) {
          const updatedConvs = [...prev]
          updatedConvs[existingConvIndex] = {
            ...updatedConvs[existingConvIndex],
            lastMessage: newMessage.trim(),
            lastMessageTime: new Date().toISOString()
          }
          return updatedConvs
        }
        return prev
      })

      // Send via API
      const response = await fetch(`/api/organizers/${organizerId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedContact,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const data = await response.json()

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => msg.id === tempId ? data.message : msg))

      // Send via WebSocket if available
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: "NEW_MESSAGE",
          message: data.message
        }))
      }

      toast({
        title: "Success",
        description: "Message sent successfully",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const startNewChat = (connection: Connection) => {
    setSelectedContact(connection.id)
    setShowNewChat(false)

    // Check if conversation already exists
    const existingConversation = conversations.find((conv) => conv.contactId === connection.id)
    if (!existingConversation) {
      // Add to conversations list
      const newConversation: Conversation = {
        id: [organizerId, connection.id].sort().join("-"),
        contactId: connection.id,
        contact: {
          firstName: connection.firstName,
          lastName: connection.lastName,
          avatar: connection.avatar,
        },
        lastMessage: "",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      }
      setConversations((prev) => [newConversation, ...prev])
    }
  }

  const getSelectedContactInfo = () => {
    if (!selectedContact) return null

    // First check conversations
    const conversation = conversations.find((conv) => conv.contactId === selectedContact)
    if (conversation?.contact) {
      return {
        firstName: conversation.contact.firstName,
        lastName: conversation.contact.lastName,
        avatar: conversation.contact.avatar,
        role: "Unknown",
        company: "Unknown",
      }
    }

    // Then check connections
    const connection = connections.find((conn) => conn.id === selectedContact)
    if (connection) {
      return {
        firstName: connection.firstName,
        lastName: connection.lastName,
        avatar: connection.avatar,
        role: connection.role,
        company: connection.company,
      }
    }

    return null
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "organizer":
        return "bg-blue-100 text-blue-800"
      case "speaker":
        return "bg-green-100 text-green-800"
      case "attendee":
        return "bg-gray-100 text-gray-800"
      case "exhibitor":
        return "bg-purple-100 text-purple-800"
      case "venue_manager":
        return "bg-orange-100 text-orange-800"
      case "admin":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/organizers/${organizerId}/messages/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete message")

      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

      // Update conversations list
      fetchConversations()

      toast({
        title: "Success",
        description: "Message deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteMessageId(null)
    }
  }

  const deleteConversation = async (contactId: string) => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/organizers/${organizerId}/messages?contactId=${contactId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete conversation")

      // Remove conversation from local state
      setConversations((prev) => prev.filter((conv) => conv.contactId !== contactId))

      // Clear selected contact if it was the deleted conversation
      if (selectedContact === contactId) {
        setSelectedContact(null)
        setMessages([])
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConversationId(null)
    }
  }

  const filteredConnections = connections.filter(
    (connection) =>
      `${connection.firstName} ${connection.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedContactInfo = getSelectedContactInfo()

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden bg-white">
      {/* Connection Status Indicator */}
      <div className={`absolute top-2 right-2 flex items-center z-10 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
        <div className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chats
            </h3>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0" aria-label="Start new chat">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Start New Chat
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search connections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      aria-label="Search connections"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredConnections.map((connection) => (
                        <div
                          key={connection.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => startNewChat(connection)}
                          onKeyPress={(e) => e.key === 'Enter' && startNewChat(connection)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Start chat with ${connection.firstName} ${connection.lastName}`}
                        >
                          <div className="relative">
                            <Image
                              src={connection.avatar || "/placeholder.svg"}
                              alt={`${connection.firstName} ${connection.lastName}`}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            {connection.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {connection.firstName} {connection.lastName}
                              </p>
                              <Badge className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(connection.role)}`}>
                                {connection.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{connection.company}</p>
                          </div>
                        </div>
                      ))}
                      {filteredConnections.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No connections found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chats..."
              className="pl-10 h-9"
              aria-label="Search chats"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="sr-only">Loading conversations</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">No conversations yet</p>
              <p className="text-xs text-gray-400">Start a new chat to begin messaging</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 hover:bg-gray-50 cursor-pointer ${selectedContact === conversation.contactId ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                >
                  <div
                    className="flex items-start gap-3"
                    onClick={() => setSelectedContact(conversation.contactId)}
                    onKeyPress={(e) => e.key === 'Enter' && setSelectedContact(conversation.contactId)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open conversation with ${conversation.contact?.firstName} ${conversation.contact?.lastName}`}
                  >
                    <Image
                      src={conversation.contact?.avatar || "/placeholder.svg?height=40&width=40"}
                      alt="Contact"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {conversation.contact?.firstName} {conversation.contact?.lastName}
                        </p>
                        <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Delete button for conversations */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConversationId(conversation.contactId)
                    }}
                    aria-label="Delete conversation"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact && selectedContactInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedContactInfo.avatar || "/placeholder.svg"}
                    alt={`${selectedContactInfo.firstName} ${selectedContactInfo.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedContactInfo.firstName} {selectedContactInfo.lastName}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getRoleBadgeColor(selectedContactInfo.role)}`}>
                        {selectedContactInfo.role}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {connections.find(c => c.id === selectedContact)?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" aria-label="Call">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Video call">
                    <Video className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="More options">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteConversationId(selectedContact)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="sr-only">Loading messages</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`group flex ${message.senderId === organizerId ? "justify-end" : "justify-start"}`}
                    >
                      <div className="relative max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg ${message.senderId === organizerId ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${message.senderId === organizerId ? "text-blue-100" : "text-gray-500"
                              }`}
                          >
                            <span className="text-xs">{formatTime(message.createdAt)}</span>
                            {message.senderId === organizerId &&
                              (message.isRead ?
                                <CheckCheck className="w-3 h-3" aria-label="Message read" /> :
                                <Check className="w-3 h-3" aria-label="Message sent" />)}
                          </div>
                        </div>
                        {/* Delete button for messages */}
                        {message.senderId === organizerId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -left-8 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeleteMessageId(message.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={sending}
                  aria-label="Type a message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 mb-4">Choose from your existing conversations or start a new one</p>
              <Button onClick={() => setShowNewChat(true)} aria-label="Start new chat">
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete message confirmation dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMessageId && deleteMessage(deleteMessageId)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete conversation confirmation dialog */}
      <AlertDialog open={!!deleteConversationId} onOpenChange={() => setDeleteConversationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire conversation? All messages will be permanently deleted and
              this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversationId && deleteConversation(deleteConversationId)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function setupPolling() {
  throw new Error("Function not implemented.")
}
