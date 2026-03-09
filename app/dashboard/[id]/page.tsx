// If you're still having issues with the server component, try this:
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { UserDashboard } from "../user-dashboard"
import { NameBanner } from "../NameBanner"
import Navbar from "../navbar"
import { DashboardProvider } from "@/contexts/dashboard-context"

interface DashboardPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect("/login")
    }

    // Only allow viewing your own dashboard
    if (session.user.id !== id) {
      redirect("/login")
    }

    return (
      <DashboardProvider>
        <Navbar />
        <NameBanner
          name={session.user.name || "User"}
          designation={
            session.user.role === "ATTENDEE"
              ? "Visitor"
              : session.user.role || ""
          }
        />
        <UserDashboard userId={id} />
      </DashboardProvider>
    )
  } catch (error) {
    console.error("Error in DashboardPage:", error)
    redirect("/login")
  }
}