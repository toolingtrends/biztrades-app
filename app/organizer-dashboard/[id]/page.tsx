import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { NameBanner } from "@/app/dashboard/NameBanner"
import OrganizerDashboardPage from "../OrganizerDashboardPage"
import Navbar from "../navbar"
import { DashboardProvider } from "@/contexts/dashboard-context"

interface DashboardPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only allow self or organizer
  if (session.user.id !== id && session.user.role !== "ORGANIZER") {
    redirect("/login")
  }

  return (
    <DashboardProvider>
      <Navbar />
      <NameBanner
        name={session.user.name || "Organizer"}
        designation={session.user.role || ""}
      />
      <OrganizerDashboardPage organizerId={id} />
    </DashboardProvider>
  )
}