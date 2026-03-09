import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import VenueDashboardPage from "../venue-layout"
import { NameBanner } from "../NavBanner"
import Navbar from "../navbar"
import { DashboardProvider } from "@/contexts/dashboard-context"

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Check if user is trying to access their own dashboard or if they're admin
  if (session.user.id !== id && session.user.role !== "VENUE_MANAGER") {
    redirect("/login")
  }

  return (
    <DashboardProvider>
      <div>
        <Navbar/>
        <NameBanner 
          name={session.user.name || "Venue_Manager"}
          designation={session.user.role || ""}
        />
        <VenueDashboardPage userId={id} />
      </div>
    </DashboardProvider>
  )
}