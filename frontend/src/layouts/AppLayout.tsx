import { useEffect, useRef, useState } from "react"
import { Outlet } from "react-router"
import { Bell } from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { TopNavbar } from "../components/layout/TopNavbar"
import { getUnreadNotifications, type NotificationResponse } from "../lib/api"
import { getAuthUser } from "../lib/auth"

const NOTIFICATION_REFRESH_EVENT = "smart-queue-notifications-updated"

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationResponse[]>([])
  const [toastNotification, setToastNotification] = useState<NotificationResponse | null>(null)
  const knownUnreadIdsRef = useRef<Set<number>>(new Set())
  const notificationsReadyRef = useRef(false)
  const toastTimeoutRef = useRef<number | null>(null)
  const unreadCount = unreadNotifications.length

  useEffect(() => {
    let stopped = false

    async function refreshUnreadNotifications(options: { showToast?: boolean } = {}) {
      const user = getAuthUser()

      if (!user) {
        knownUnreadIdsRef.current = new Set()
        notificationsReadyRef.current = false
        setUnreadNotifications([])
        setToastNotification(null)
        return
      }

      try {
        const loadedUnreadNotifications = await getUnreadNotifications()

        if (stopped) return

        const nextUnreadIds = new Set(loadedUnreadNotifications.map((notification) => notification.id))

        if (notificationsReadyRef.current && options.showToast !== false) {
          const newNotifications = loadedUnreadNotifications.filter((notification) => !knownUnreadIdsRef.current.has(notification.id))

          if (newNotifications.length > 0) {
            const newestNotification = [...newNotifications].sort(
              (firstNotification, secondNotification) => new Date(secondNotification.createdAt).getTime() - new Date(firstNotification.createdAt).getTime(),
            )[0]

            setToastNotification(newestNotification)

            if (toastTimeoutRef.current) {
              window.clearTimeout(toastTimeoutRef.current)
            }

            toastTimeoutRef.current = window.setTimeout(() => {
              setToastNotification(null)
            }, 4500)
          }
        }

        notificationsReadyRef.current = true
        knownUnreadIdsRef.current = nextUnreadIds
        setUnreadNotifications(loadedUnreadNotifications)
      } catch {
        if (!stopped) {
          setUnreadNotifications([])
        }
      }
    }

    void refreshUnreadNotifications({ showToast: false })

    const intervalId = window.setInterval(() => {
      void refreshUnreadNotifications({ showToast: true })
    }, 3000)

    const handleManualRefresh = () => {
      void refreshUnreadNotifications({ showToast: false })
    }

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, handleManualRefresh)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, handleManualRefresh)

      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_34rem)]" />

      <div className="flex min-h-screen">
        <Sidebar unreadNotifications={unreadCount} />

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
              aria-label="Chiudi menu"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative h-full w-80 max-w-[88vw] animate-[fadeInUp_220ms_ease] shadow-2xl shadow-black/50">
              <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} unreadNotifications={unreadCount} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar onOpenMenu={() => setMobileMenuOpen(true)} unreadNotifications={unreadCount} />

          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 xl:max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {toastNotification && (
        <div className="fixed right-4 top-20 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-cyan-300/25 bg-slate-900/95 p-4 text-left shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <Bell className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">Nuova notifica</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">{toastNotification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="ml-auto rounded-full px-2 py-1 text-xs font-black text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Chiudi avviso"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
