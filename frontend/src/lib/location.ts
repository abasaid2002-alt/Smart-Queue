import type { BusinessResponse } from "./api"

export type UserCoordinates = {
  latitude: number
  longitude: number
}

export type BusinessWithDistance = BusinessResponse & {
  distanceKm?: number
}

const geocodeCache = new Map<string, UserCoordinates | null>()

function buildAddressQuery(business: Pick<BusinessResponse, "name" | "address" | "city">) {
  return [business.address, business.city].filter(Boolean).join(", ") || business.name
}

export function getBusinessAddressLabel(business: Pick<BusinessResponse, "address" | "city">) {
  return [business.address, business.city].filter(Boolean).join(", ")
}

export function buildGoogleMapsUrl(business: Pick<BusinessResponse, "name" | "address" | "city">) {
  const query = encodeURIComponent(buildAddressQuery(business))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function buildAppleMapsUrl(business: Pick<BusinessResponse, "name" | "address" | "city">) {
  const query = encodeURIComponent(buildAddressQuery(business))
  return `https://maps.apple.com/?q=${query}`
}

export function buildWazeUrl(business: Pick<BusinessResponse, "name" | "address" | "city">) {
  const query = encodeURIComponent(buildAddressQuery(business))
  return `https://waze.com/ul?q=${query}&navigate=yes`
}

export function formatDistance(distanceKm?: number) {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm)) return null

  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m`
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`
}

export function getCurrentPosition() {
  return new Promise<UserCoordinates>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalizzazione non disponibile nel browser."))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        reject(new Error("Posizione non autorizzata."))
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10000,
      },
    )
  })
}

export async function sortBusinessesByDistance(businesses: BusinessResponse[], userCoordinates: UserCoordinates): Promise<BusinessWithDistance[]> {
  const businessesWithDistance = await Promise.all(
    businesses.map(async (business) => {
      const coordinates = await geocodeBusiness(business)
      const distanceKm = coordinates ? calculateDistanceKm(userCoordinates, coordinates) : undefined

      return {
        ...business,
        distanceKm,
      }
    }),
  )

  return businessesWithDistance.sort((firstBusiness, secondBusiness) => {
    const firstDistance = firstBusiness.distanceKm ?? Number.POSITIVE_INFINITY
    const secondDistance = secondBusiness.distanceKm ?? Number.POSITIVE_INFINITY

    if (firstDistance !== secondDistance) return firstDistance - secondDistance

    return firstBusiness.name.localeCompare(secondBusiness.name, "it")
  })
}

async function geocodeBusiness(business: BusinessResponse): Promise<UserCoordinates | null> {
  const query = buildAddressQuery(business)

  if (!query.trim()) return null
  if (geocodeCache.has(query)) return geocodeCache.get(query) ?? null

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "it",
      },
    })

    if (!response.ok) {
      geocodeCache.set(query, null)
      return null
    }

    const results = (await response.json()) as Array<{
      lat?: string
      lon?: string
    }>

    const firstResult = results[0]

    if (!firstResult?.lat || !firstResult.lon) {
      geocodeCache.set(query, null)
      return null
    }

    const coordinates = {
      latitude: Number(firstResult.lat),
      longitude: Number(firstResult.lon),
    }

    if (Number.isNaN(coordinates.latitude) || Number.isNaN(coordinates.longitude)) {
      geocodeCache.set(query, null)
      return null
    }

    geocodeCache.set(query, coordinates)
    return coordinates
  } catch {
    geocodeCache.set(query, null)
    return null
  }
}

function calculateDistanceKm(start: UserCoordinates, end: UserCoordinates) {
  const earthRadiusKm = 6371

  const latitudeDistance = toRadians(end.latitude - start.latitude)
  const longitudeDistance = toRadians(end.longitude - start.longitude)

  const startLatitude = toRadians(start.latitude)
  const endLatitude = toRadians(end.latitude)

  const haversineValue = Math.sin(latitudeDistance / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDistance / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180)
}
