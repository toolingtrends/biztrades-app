import HeroSlideshowClient from "./HeroSlideshowClient"

export const revalidate = 60

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

function normalizeEvent(event: any) {
  return {
    ...event,
    startDate: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
    endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
    venue: event.venue ?? {
      venueCity: event.city ?? null,
      venueCountry: event.country ?? null,
    },
  }
}

export default async function HeroSlideshow() {
  let events: any[] = []

  try {
    // 1) Try VIP endpoint first
    const vipRes = await fetch(`${API_BASE_URL}/api/events/vip`, {
      next: { revalidate: 60 },
    })
    if (vipRes.ok) {
      const data = await vipRes.json()
      const raw = Array.isArray(data) ? data : data?.events ?? []
      events = raw.map(normalizeEvent)
    }

    // 2) If no VIP events, fetch main events list and show ones with isVIP true (NeonDB column may be is_vip / isVIP)
    if (events.length === 0) {
      const listRes = await fetch(`${API_BASE_URL}/api/events?limit=20`, {
        next: { revalidate: 60 },
      })
      if (listRes.ok) {
        const data = await listRes.json()
        const list = data?.events ?? []
        const vipOnly = list.filter((e: any) => e?.isVIP === true || e?.is_vip === true)
        events = vipOnly.map(normalizeEvent)
      }
    }
  } catch (err) {
    console.error("Hero slideshow error:", err)
  }

  return <HeroSlideshowClient initialEvents={events} />
}
