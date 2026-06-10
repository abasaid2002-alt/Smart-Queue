import { BarChart3, Bell, LayoutDashboard, ListOrdered, Settings, Store, TicketCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router"
import { getAuthUser } from "../../lib/auth"
import { getEffectiveWorkspaceMode, getNavigationLabel, useUserPreferences, type NavigationItemId } from "../../lib/preferences"

type NavigationItem = {
  id: NavigationItemId
  path: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { id: "dashboard", path: "/dashboard", icon: LayoutDashboard },
  { id: "queue", path: "/queue", icon: ListOrdered },
  { id: "tickets", path: "/tickets", icon: TicketCheck },
  { id: "analytics", path: "/analytics", icon: BarChart3 },
  { id: "notifications", path: "/notifications", icon: Bell },
  { id: "settings", path: "/settings", icon: Settings },
]

type SidebarProps = {
  mobile?: boolean
  onNavigate?: () => void
  unreadNotifications?: number
}

export function Sidebar({ mobile = false, onNavigate, unreadNotifications = 0 }: SidebarProps) {
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)
  const orderedNavigationItems = preferences.navigationOrder
    .map((itemId) => navigationItems.find((item) => item.id === itemId))
    .filter((item): item is NavigationItem => Boolean(item))
    .filter((item) => effectiveMode === "MANAGER" || item.id !== "analytics")

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col border-r border-white/10 bg-slate-950/98 px-4 py-5"
          : "hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col"
      }
    >
      <div className="mb-8 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-3 py-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
          <Store className="size-6" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-white">Smart Queue</p>
          <p className="truncate text-xs text-slate-400">
            {effectiveMode === "MANAGER"
              ? preferences.language === "it"
                ? "Gestione code e ticket"
                : "Queue and ticket management"
              : preferences.language === "it"
                ? "Prenotazioni e ticket"
                : "Bookings and tickets"}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5" aria-label="Menu principale">
        {orderedNavigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200",
                  isActive ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/15" : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{getSidebarLabel(item.id, preferences.language, effectiveMode)}</span>
              {item.id === "notifications" && unreadNotifications > 0 && (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-white shadow-lg shadow-red-500/20">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-bold text-white">Smart Queue</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          {preferences.language === "it"
            ? effectiveMode === "MANAGER"
              ? "Gestisci attività, code e messaggi da un unico pannello."
              : "Trova attività aperte, prendi il numero e segui il tuo turno."
            : effectiveMode === "MANAGER"
              ? "Manage businesses, queues and messages from one panel."
              : "Find open businesses, take a number and follow your turn."}
        </p>
      </div>
    </aside>
  )
}

function getSidebarLabel(itemId: NavigationItemId, language: ReturnType<typeof useUserPreferences>["language"], mode: "MANAGER" | "CLIENT") {
  if (mode !== "CLIENT") return getNavigationLabel(itemId, language)

  if (itemId === "queue") return language === "it" ? "Prenota ticket" : "Book ticket"
  if (itemId === "tickets") return language === "it" ? "I miei ticket" : "My tickets"
  if (itemId === "notifications") return language === "it" ? "Notifiche" : "Notifications"
  if (itemId === "settings") return language === "it" ? "Impostazioni" : "Settings"

  return getNavigationLabel(itemId, language)
}
