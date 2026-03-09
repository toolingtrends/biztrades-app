import { adminApi } from "../../shared/services/admin-api"

export interface GetEventsResponse {
  success?: boolean
  events?: unknown[]
  data?: { events?: unknown[] }
}

export interface GetCategoriesResponse {
  data?: unknown[]
}

export async function getEvents(): Promise<GetEventsResponse> {
  return adminApi<GetEventsResponse>("/events", { auth: true })
}

export async function getEventById(id: string) {
  return adminApi<{ success?: boolean; data?: unknown }>(`/events/${id}`, { auth: true })
}

export async function updateEvent(id: string, body: Record<string, unknown>) {
  return adminApi<{ success?: boolean; data?: unknown }>(`/events/${id}`, {
    method: "PATCH",
    body,
    auth: true,
  })
}

export async function deleteEvent(id: string) {
  return adminApi(`/events/${id}`, { method: "DELETE", auth: true })
}

export async function getEventCategories(): Promise<unknown[] | GetCategoriesResponse> {
  return adminApi<unknown[] | GetCategoriesResponse>("/event-categories", { auth: true })
}
