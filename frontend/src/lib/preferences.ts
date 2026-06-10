import { useEffect, useState } from "react"

export type LanguageCode = "it" | "en" | "fr" | "de" | "es" | "ar"
export type NavigationItemId = "dashboard" | "queue" | "tickets" | "analytics" | "notifications" | "settings"
export type WorkspaceMode = "MANAGER" | "CLIENT"

export type UserPreferences = {
  language: LanguageCode
  navigationOrder: NavigationItemId[]
  workspaceMode: WorkspaceMode
}

export const DEFAULT_NAVIGATION_ORDER: NavigationItemId[] = ["dashboard", "queue", "tickets", "analytics", "notifications", "settings"]

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "it",
  navigationOrder: DEFAULT_NAVIGATION_ORDER,
  workspaceMode: "MANAGER",
}

const STORAGE_KEY = "smart_queue_user_preferences"
const CHANGE_EVENT = "smart-queue-preferences-change"

const supportedLanguages: LanguageCode[] = ["it", "en", "fr", "de", "es", "ar"]
const supportedWorkspaceModes: WorkspaceMode[] = ["MANAGER", "CLIENT"]

function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && supportedLanguages.includes(value as LanguageCode)
}

function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return typeof value === "string" && supportedWorkspaceModes.includes(value as WorkspaceMode)
}

function normalizeNavigationOrder(value: unknown): NavigationItemId[] {
  if (!Array.isArray(value)) return DEFAULT_NAVIGATION_ORDER

  const validItems = value.filter((item): item is NavigationItemId => DEFAULT_NAVIGATION_ORDER.includes(item as NavigationItemId))
  const uniqueItems = Array.from(new Set(validItems))
  const missingItems = DEFAULT_NAVIGATION_ORDER.filter((item) => !uniqueItems.includes(item))

  return [...uniqueItems, ...missingItems]
}

export function getUserPreferences(): UserPreferences {
  try {
    const rawPreferences = localStorage.getItem(STORAGE_KEY)

    if (!rawPreferences) return DEFAULT_USER_PREFERENCES

    const parsedPreferences = JSON.parse(rawPreferences) as Partial<UserPreferences>

    return {
      language: isLanguageCode(parsedPreferences.language) ? parsedPreferences.language : DEFAULT_USER_PREFERENCES.language,
      navigationOrder: normalizeNavigationOrder(parsedPreferences.navigationOrder),
      workspaceMode: isWorkspaceMode(parsedPreferences.workspaceMode) ? parsedPreferences.workspaceMode : DEFAULT_USER_PREFERENCES.workspaceMode,
    }
  } catch {
    return DEFAULT_USER_PREFERENCES
  }
}

export function saveUserPreferences(nextPreferences: UserPreferences) {
  const normalizedPreferences: UserPreferences = {
    language: isLanguageCode(nextPreferences.language) ? nextPreferences.language : DEFAULT_USER_PREFERENCES.language,
    navigationOrder: normalizeNavigationOrder(nextPreferences.navigationOrder),
    workspaceMode: isWorkspaceMode(nextPreferences.workspaceMode) ? nextPreferences.workspaceMode : DEFAULT_USER_PREFERENCES.workspaceMode,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedPreferences))
  document.documentElement.lang = normalizedPreferences.language
  document.documentElement.dir = normalizedPreferences.language === "ar" ? "rtl" : "ltr"
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function resetUserPreferences() {
  saveUserPreferences(DEFAULT_USER_PREFERENCES)
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => getUserPreferences())

  useEffect(() => {
    document.documentElement.lang = preferences.language
    document.documentElement.dir = preferences.language === "ar" ? "rtl" : "ltr"
  }, [preferences.language])

  useEffect(() => {
    function handlePreferencesChange() {
      setPreferences(getUserPreferences())
    }

    window.addEventListener(CHANGE_EVENT, handlePreferencesChange)
    window.addEventListener("storage", handlePreferencesChange)

    return () => {
      window.removeEventListener(CHANGE_EVENT, handlePreferencesChange)
      window.removeEventListener("storage", handlePreferencesChange)
    }
  }, [])

  return preferences
}

export function updateUserPreferences(partialPreferences: Partial<UserPreferences>) {
  saveUserPreferences({
    ...getUserPreferences(),
    ...partialPreferences,
  })
}

export function moveNavigationItem(order: NavigationItemId[], itemId: NavigationItemId, direction: "up" | "down") {
  const currentOrder = normalizeNavigationOrder(order)
  const currentIndex = currentOrder.indexOf(itemId)
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) {
    return currentOrder
  }

  const nextOrder = [...currentOrder]
  const [item] = nextOrder.splice(currentIndex, 1)
  nextOrder.splice(nextIndex, 0, item)

  return nextOrder
}

export function getEffectiveWorkspaceMode(userRole?: WorkspaceMode | null, preferredMode = getUserPreferences().workspaceMode): WorkspaceMode {
  if (userRole !== "MANAGER") return "CLIENT"
  return preferredMode === "CLIENT" ? "CLIENT" : "MANAGER"
}

export const navigationLabels: Record<NavigationItemId, Record<LanguageCode, string>> = {
  dashboard: {
    it: "Dashboard",
    en: "Dashboard",
    fr: "Tableau de bord",
    de: "Dashboard",
    es: "Panel",
    ar: "لوحة التحكم",
  },
  queue: {
    it: "Coda",
    en: "Queue",
    fr: "File d’attente",
    de: "Warteschlange",
    es: "Cola",
    ar: "الطابور",
  },
  tickets: {
    it: "Ticket",
    en: "Tickets",
    fr: "Tickets",
    de: "Tickets",
    es: "Tickets",
    ar: "التذاكر",
  },
  analytics: {
    it: "Statistiche",
    en: "Analytics",
    fr: "Statistiques",
    de: "Statistiken",
    es: "Estadísticas",
    ar: "الإحصائيات",
  },
  notifications: {
    it: "Notifiche",
    en: "Notifications",
    fr: "Notifications",
    de: "Benachrichtigungen",
    es: "Notificaciones",
    ar: "الإشعارات",
  },
  settings: {
    it: "Impostazioni",
    en: "Settings",
    fr: "Paramètres",
    de: "Einstellungen",
    es: "Ajustes",
    ar: "الإعدادات",
  },
}

export function getNavigationLabel(itemId: NavigationItemId, language: LanguageCode) {
  return navigationLabels[itemId][language]
}
