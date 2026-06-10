import { Bell, LogOut, Menu, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { logout } from "../../lib/auth"
import { getNavigationLabel, useUserPreferences, type NavigationItemId } from "../../lib/preferences"

const pageTitleIds: Record<string, NavigationItemId> = {
  "/dashboard": "dashboard",
  "/queue": "queue",
  "/tickets": "tickets",
  "/analytics": "analytics",
  "/notifications": "notifications",
  "/settings": "settings",
}

type TopNavbarProps = {
  onOpenMenu: () => void
  unreadNotifications?: number
}

export function TopNavbar({ onOpenMenu, unreadNotifications = 0 }: TopNavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const preferences = useUserPreferences()
  const titleId = pageTitleIds[location.pathname]
  const title = titleId ? getNavigationLabel(titleId, preferences.language) : "Smart Queue"

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  function openNotifications() {
    navigate("/notifications")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/82 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label={preferences.language === "it" ? "Apri menu" : "Open menu"}
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-cyan-300">Smart Queue</p>
          <h1 className="truncate text-base font-black text-white sm:text-lg">{title}</h1>
        </div>

        <div className="hidden w-72 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 transition focus-within:border-cyan-300/50 focus-within:bg-white/[0.06] md:flex xl:w-96">
          <Search className="size-4 shrink-0 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder={preferences.language === "it" ? "Cerca ticket, code, attività..." : "Search tickets, queues, businesses..."}
            type="text"
          />
        </div>

        <button
          type="button"
          onClick={openNotifications}
          className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label={getNavigationLabel("notifications", preferences.language)}
        >
          <Bell className="size-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.65rem] font-black leading-none text-white shadow-lg shadow-red-500/30">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-100 sm:px-4"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{preferences.language === "it" ? "Esci" : "Sign out"}</span>
        </button>
      </div>
    </header>
  )
}
