import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react"
import { ArrowUpRight, Bell, Clock3, MapPin, LayoutDashboard, Store, TicketCheck } from "lucide-react"
import { Link, useNavigate } from "react-router"
import {
  closeQueue,
  getApiErrorMessage,
  getBusinesses,
  getMyBusinesses,
  getMyTickets,
  getNotifications,
  getQueueByBusiness,
  openQueue,
  type QueueResponse,
  type TicketResponse,
} from "../lib/api"
import { getAuthUser } from "../lib/auth"
import { getEffectiveWorkspaceMode, useUserPreferences } from "../lib/preferences"
import {
  buildGoogleMapsUrl,
  formatDistance,
  getBusinessAddressLabel,
  getCurrentPosition,
  sortBusinessesByDistance,
  type BusinessWithDistance,
} from "../lib/location"

function formatBusinessHours(openingTime?: string | null, closingTime?: string | null) {
  if (!openingTime || !closingTime) return "Orari non impostati"
  return `${openingTime} - ${closingTime}`
}

function queueStatusLabel(status: QueueResponse["status"]) {
  return status === "OPEN" ? "Aperta" : "Chiusa"
}

function queueBadgeClass(status: QueueResponse["status"]) {
  return status === "OPEN" ? "badge badge-success" : "badge badge-muted"
}

export function DashboardPage() {
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([])
  const [queues, setQueues] = useState<QueueResponse[]>([])
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [queueActionLoadingId, setQueueActionLoadingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    async function loadDashboard(options: { silent?: boolean } = {}) {
      if (!options.silent) {
        setLoading(true)
        setError("")
      }

      try {
        const baseBusinesses =
          effectiveMode === "MANAGER"
            ? await getMyBusinesses()
            : (await getBusinesses()).filter((business) => user?.role !== "MANAGER" || business.ownerId !== user.id)

        const loadedQueues = await Promise.all(
          baseBusinesses.map(async (business) => {
            try {
              return await getQueueByBusiness(business.id)
            } catch {
              return null
            }
          }),
        )

        const validQueues = loadedQueues.filter((queue): queue is QueueResponse => queue !== null)
        const openQueues = validQueues.filter((queue) => queue.status === "OPEN")
        const openBusinessIds = new Set(openQueues.map((queue) => queue.businessId))

        let loadedBusinesses: BusinessWithDistance[] =
          effectiveMode === "CLIENT" ? baseBusinesses.filter((business) => openBusinessIds.has(business.id)) : baseBusinesses
        const nextQueues = effectiveMode === "CLIENT" ? openQueues : validQueues
        if (effectiveMode === "CLIENT" && loadedBusinesses.length > 0) {
          try {
            const userPosition = await getCurrentPosition()
            loadedBusinesses = await sortBusinessesByDistance(loadedBusinesses, userPosition)
          } catch {
            loadedBusinesses = [...loadedBusinesses].sort((firstBusiness, secondBusiness) => firstBusiness.name.localeCompare(secondBusiness.name, "it"))
          }
        }

        const loadedTickets = await getMyTickets()
        const loadedNotifications = await getNotifications()

        if (!ignore) {
          setBusinesses(loadedBusinesses)
          setQueues(nextQueues)
          setTickets(loadedTickets)
          setNotificationsCount(loadedNotifications.filter((notification) => !notification.read).length)
        }
      } catch (caughtError) {
        if (!ignore && !options.silent) {
          setError(getApiErrorMessage(caughtError))
        }
      } finally {
        if (!ignore && !options.silent) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    const intervalId = window.setInterval(() => {
      void loadDashboard({ silent: true })
    }, 5000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [effectiveMode, user?.id, user?.role])

  const activeTickets = useMemo(() => tickets.filter((ticket) => ticket.status === "WAITING" || ticket.status === "SERVING"), [tickets])
  const waitingTickets = useMemo(() => tickets.filter((ticket) => ticket.status === "WAITING"), [tickets])
  const activeQueues = useMemo(() => queues.filter((queue) => queue.status === "OPEN"), [queues])
  const businessesById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses])
  const averageWaitingPeople = useMemo(() => {
    if (waitingTickets.length === 0) return 0
    const total = waitingTickets.reduce((sum, ticket) => sum + ticket.peopleBefore, 0)
    return Math.ceil(total / waitingTickets.length)
  }, [waitingTickets])

  async function toggleQueueStatus(queue: QueueResponse, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.preventDefault()
    setQueueActionLoadingId(queue.id)
    setError("")

    try {
      const updatedQueue = queue.status === "OPEN" ? await closeQueue(queue.id) : await openQueue(queue.id)
      setQueues((currentQueues) => currentQueues.map((currentQueue) => (currentQueue.id === updatedQueue.id ? updatedQueue : currentQueue)))
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setQueueActionLoadingId(null)
    }
  }

  function openQueuePage(queue: QueueResponse) {
    navigate(`/queue?businessId=${queue.businessId}`, {
      state: { selectedBusinessId: queue.businessId },
    })
  }

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div className="panel-card overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-br from-cyan-400/18 via-slate-900/80 to-slate-950 p-5 sm:p-8">
          <div className="flex max-w-3xl flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <LayoutDashboard className="size-4" />
              {effectiveMode === "MANAGER" ? "Pannello manager" : "Area cliente"}
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Ciao {user?.name ?? "utente"}, benvenuto in Smart Queue.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {effectiveMode === "MANAGER"
                  ? "Gestisci attività, code e ticket da un pannello chiaro e veloce."
                  : "Trova attività aperte, prendi il numero e segui il tuo turno in tempo reale."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/queue" className="action-button bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto">
                {effectiveMode === "MANAGER" ? "Gestisci code" : "Prendi numero"}
                <ArrowUpRight className="size-4" />
              </Link>

              <Link
                to={effectiveMode === "MANAGER" ? "/analytics" : "/tickets"}
                className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 sm:w-auto"
              >
                {effectiveMode === "MANAGER" ? "Apri statistiche" : "I miei ticket"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={effectiveMode === "MANAGER" ? "Attività" : "Attività disponibili"}
          value={businesses.length}
          description={effectiveMode === "MANAGER" ? "Attività collegate al tuo account." : "Premi qui per scegliere dove prendere il numero."}
          icon={<Store />}
          to={effectiveMode === "CLIENT" ? "/queue" : undefined}
        />
        {effectiveMode === "MANAGER" && (
          <MetricCard title="Code aperte" value={activeQueues.length} description="Code che accettano nuovi ticket." icon={<TicketCheck />} />
        )}
        <MetricCard title="Ticket attivi" value={activeTickets.length} description="Ticket in attesa o in servizio." icon={<Clock3 />} />
        <MetricCard title="Notifiche non lette" value={notificationsCount} description="Aggiornamenti ancora da leggere." icon={<Bell />} />
      </div>

      <div className={effectiveMode === "MANAGER" ? "grid gap-4 xl:grid-cols-[1.2fr_0.8fr]" : "grid gap-4"}>
        {effectiveMode === "MANAGER" && (
          <div className="panel-card rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Le tue attività</h3>
                <p className="mt-1 text-sm text-slate-400">Apri una scheda per gestire coda, ticket e orari.</p>
              </div>
              {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
            </div>

            <div className="mt-5 space-y-3">
              {queues.length === 0 && <EmptyState text="Nessuna coda disponibile al momento." />}
              {queues.slice(0, 5).map((queue) => {
                const business = businessesById.get(queue.businessId)
                const distance = formatDistance(business?.distanceKm)
                const address = business ? getBusinessAddressLabel(business) : ""

                return (
                  <div
                    key={queue.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openQueuePage(queue)}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === "Enter" || event.key === " ") openQueuePage(queue)
                    }}
                    className="soft-card-hover w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{queue.businessName}</p>
                        <p className="mt-1 text-xs font-semibold text-cyan-300">
                          {effectiveMode === "MANAGER" ? "Apri gestione attività" : "Apri prenotazione"}
                          {distance ? ` · ${distance}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Numero corrente: {queue.currentNumber || "—"} · Ultimo numero: {queue.lastNumber}
                        </p>
                        {business && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <Clock3 className="size-3.5" />
                            {formatBusinessHours(business.openingTime, business.closingTime)}
                          </p>
                        )}
                        {queue.availabilityMessage && <p className="mt-1 text-xs text-slate-500">{queue.availabilityMessage}</p>}
                        {business && address && (
                          <a
                            href={buildGoogleMapsUrl(business)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
                          >
                            <MapPin className="size-3.5" />
                            {address}
                          </a>
                        )}
                      </div>

                      {effectiveMode === "MANAGER" ? (
                        <button
                          type="button"
                          disabled={queueActionLoadingId === queue.id}
                          onClick={(event) => toggleQueueStatus(queue, event)}
                          className={`rounded-full border px-3 py-1 text-xs font-bold transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${queueBadgeClass(queue.status)}`}
                          title={queue.status === "OPEN" ? "Chiudi coda" : "Riapri coda"}
                        >
                          {queueActionLoadingId === queue.id ? "..." : queueStatusLabel(queue.status)}
                        </button>
                      ) : (
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${queueBadgeClass(queue.status)}`}>
                          {queueStatusLabel(queue.status)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="panel-card rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white">Sintesi attesa</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Media persone davanti ai ticket in attesa: <span className="font-bold text-white">{averageWaitingPeople}</span>.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">Puoi seguire lo stato dei ticket e ricevere aggiornamenti dalla sezione Notifiche.</p>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ title, value, description, icon, to }: { title: string; value: number; description: string; icon: ReactNode; to?: string }) {
  const content = (
    <article className="soft-card-hover panel-card h-full rounded-3xl p-4 sm:p-5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 border-t border-white/10 pt-4">
        <span className="text-3xl font-black text-white">{value}</span>
      </div>
    </article>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {content}
      </Link>
    )
  }

  return content
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">{text}</div>
}
