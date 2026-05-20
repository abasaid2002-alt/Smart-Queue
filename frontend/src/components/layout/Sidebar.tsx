import { BarChart3, Bell, LayoutDashboard, ListOrdered, Settings, Store, TicketCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router"

type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Coda",
    path: "/queue",
    icon: ListOrdered,
  },
  {
    label: "Ticket",
    path: "/tickets",
    icon: TicketCheck,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Notifiche",
    path: "/notifications",
    icon: Bell,
  },
  {
    label: "Impostazioni",
    path: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/95 px-4 py-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
          <Store className="size-6" />
        </div>

        <div>
          <p className="text-base font-bold tracking-tight">Smart Queue</p>
          <p className="text-xs text-slate-400">Queue management platform</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                  isActive ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/10" : "text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">Smart Waiting Intelligence</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">Gestione coda, notifiche interne, stime dinamiche e analytics per attività commerciali.</p>
      </div>
    </aside>
  )
}
