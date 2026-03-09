import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth-options"

export default async function VenueDashboardRoot() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user.role || "").toString().toUpperCase()

  // Only venue managers are allowed here
  if (role !== "VENUE_MANAGER") {
    redirect("/login")
  }

  const id = session.user.id
  if (!id) {
    redirect("/login")
  }

  redirect(`/venue-dashboard/${id}`)
}

