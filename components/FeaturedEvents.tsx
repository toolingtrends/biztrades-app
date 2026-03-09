import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { CarouselWrapper } from "./CarouselWrapper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// 🧩 Fetch data including venue details AND rating (no caching)
async function getFeaturedEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/featured`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Featured events backend error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const rawEvents: any[] = Array.isArray(data) ? data : data.events ?? [];

    return rawEvents.map((event) => ({
      id: event.id,
      title: event.title ?? "",
      slug: event.slug ?? null,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate ?? event.startDate),
      bannerImage: event.bannerImage ?? (event.images?.[0] ?? null),
      edition: event.edition ?? null,
      tags: event.tags ?? [],
      eventType: event.eventType ?? [],
      averageRating: event.averageRating ?? 0,
      totalReviews: event.totalReviews ?? 0,
      venue: event.venue
        ? {
            venueName: event.venue.venueName ?? null,
            venueAddress: event.venue.venueAddress ?? null,
            venueCity: event.venue.venueCity ?? null,
            venueCountry: event.venue.venueCountry ?? null,
          }
        : null,
    }));
  } catch (error) {
    console.error("Error fetching featured events from backend:", error);
    return [];
  }
}

interface Event {
  id: string;
  title: string;
  slug: string | null; // ADD THIS
  startDate: Date;
  endDate: Date;
  bannerImage: string | null;
  edition: string | null;
  tags: string[];
  eventType: string[];
  averageRating: number;
  totalReviews: number;
  venue: {
    venueName: string | null;
    venueAddress: string | null;
    venueCity: string | null;
    venueCountry: string | null;
  } | null;
}

// Event Card Component - UPDATED LINK
function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const startFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
  });

  const endFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedDate = `${startFormatter.format(start)} – ${endFormatter.format(end)}`;

  const venueDisplay = event.venue
    ? `${event.venue.venueName || ""}${event.venue.venueCity ? `, ${event.venue.venueCity}` : ""}`
    : "Venue details coming soon";

  const eventType = event.eventType?.[0] || "Event";

  // Generate slug from title if not available in database
  const eventSlug = event.slug || generateSlug(event.title);

  return (
    <Link href={`/event/${eventSlug}`} className="group block">
      <div
        className="flex bg-white border border-gray-200 
                   shadow-sm hover:shadow-md hover:-translate-y-1 
                   transition-all duration-300 overflow-hidden h-[160px] p-3"
      >
        {/* Left: Image */}
        <div className="w-[160px] h-full flex-shrink-0 bg-gray-100">
          <img
            src={event.bannerImage || "/herosection-images/food.jpg"}
            alt={event.title}
            className="w-full h-full rounded-lg object-cover"
          />
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col justify-between p-4">
          {/* Title + Actions */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {event.title}
            </h3>
          </div>

          {/* Venue + Edition */}
          <div className="flex flex-wrap items-center justify-between text-gray-700 text-sm font-medium mt-1">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-gray-700" />
              {venueDisplay ? venueDisplay.slice(0, 100) : ""}...
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center text-gray-800 text-sm mt-1">
            <CalendarDays className="w-4 h-4 mr-1 text-gray-700" />
            {formattedDate}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div
              className="px-2 py-0.5 text-xs font-medium rounded-full 
                         border border-gray-300 bg-gray-50 text-gray-700"
            >
              {eventType}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default async function FeaturedEvents() {
  const events = await getFeaturedEvents();

  // Convert events to EventCard components
  const eventCards = events.map((event) => (
    <EventCard key={event.id} event={event} />
  ));

  return (
    <div className="w-full max-w-7xl mx-auto mb-12 mt-12">
      {/* Section Header */}
      <div className="px-6 py-6 border-b border-gray-200 text-left">
        <h2 className="text-3xl font-semibold text-gray-900 mb-1">Featured Events</h2>
        <p className="text-gray-600">Handpicked Popular Events</p>
      </div>

      {/* Carousel */}
      <CarouselWrapper itemsPerPage={6} autoSlideInterval={5000}>
        {eventCards}
      </CarouselWrapper>
    </div>
  );
}