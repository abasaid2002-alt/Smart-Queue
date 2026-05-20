import { Bell, CircleDot, Menu, Search, Sparkles } from "lucide-react"
import { useLocation } from "react-router"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/queue": "Gestione coda",
  "/tickets": "Ticket",
  "/analytics": "Analytics manager",
  "/notifications": "Notifiche",
  "/settings": "Impostazioni",
}

export function TopNavbar() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? "Smart Queue"

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 lg:hidden"
          aria-label="Apri menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">Smart Queue</p>
          <h1 className="truncate text-lg font-bold text-white">{title}</h1>
        </div>

        <div className="hidden w-80 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
          <Search className="size-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Cerca ticket, code, attività..."
            type="text"
          />
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 sm:flex">
          <CircleDot className="size-3 fill-emerald-300" />
          Backend ready
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Notifiche"
        >
          <Bell className="size-5" />
        </button>

        <button
          type="button"
          className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 sm:inline-flex"
        >
          <Sparkles className="size-4" />
          Presenta
        </button>
      </div>
    </header>
  )
}
