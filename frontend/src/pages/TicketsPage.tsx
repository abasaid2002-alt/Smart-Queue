/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, RotateCw, Ticket, UserCheck, XCircle } from "lucide-react"
import {
  cancelTicket,
  completeTicket,
  getApiErrorMessage,
  getMyBusinesses,
  getMyTickets,
  getOrCreateConversation,
  getQueueByBusiness,
  getQueueTickets,
  getWaitingInfo,
  markNoShow,
  smartDelay,
  undoCompleteTicket,
  type BusinessResponse,
  type QueueResponse,
  type TicketResponse,
  type WaitingInfoResponse,
} from "../lib/api"
import { getAuthUser } from "../lib/auth"
import { getEffectiveWorkspaceMode, useUserPreferences } from "../lib/preferences"

function formatDateTime(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function ticketStatusLabel(status: TicketResponse["status"]) {
  const labels: Record<TicketResponse["status"], string> = {
    WAITING: "In attesa",
    SERVING: "In servizio",
    SERVED: "Completato",
    CANCELLED: "Cancellato",
    NO_SHOW: "No-show",
  }

  return labels[status]
}

function ticketBadgeClass(status: TicketResponse["status"]) {
  const classes: Record<TicketResponse["status"], string> = {
    WAITING: "badge badge-warning",
    SERVING: "badge badge-primary",
    SERVED: "badge badge-success",
    CANCELLED: "badge badge-muted",
    NO_SHOW: "badge badge-danger",
  }

  return classes[status]
}

export function TicketsPage() {
  const navigate = useNavigate()
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [queue, setQueue] = useState<QueueResponse | null>(null)
  const [waitingInfo, setWaitingInfo] = useState<Record<number, WaitingInfoResponse>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void loadWorkspaceTickets(effectiveMode)
  }, [effectiveMode])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshTickets(true)
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [effectiveMode, selectedBusinessId])

  useEffect(() => {
    if (effectiveMode !== "MANAGER" || !selectedBusinessId) return
    void loadManagerTickets(selectedBusinessId)
  }, [selectedBusinessId, effectiveMode])

  async function loadWorkspaceTickets(mode: typeof effectiveMode, silent = false) {
    if (mode === "MANAGER") {
      await loadManagerBusinesses(silent)
      return
    }

    setBusinesses([])
    setSelectedBusinessId(null)
    setQueue(null)
    await loadClientTickets(silent)
  }

  async function loadManagerBusinesses(silent = false) {
    if (!silent) {
      setLoading(true)
      setError("")
    }

    try {
      const loadedBusinesses = await getMyBusinesses()
      setBusinesses(loadedBusinesses)
      setSelectedBusinessId((current) => current ?? loadedBusinesses[0]?.id ?? null)
    } catch (caughtError) {
      if (!silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  async function loadManagerTickets(businessId = selectedBusinessId, silent = false) {
    if (!businessId) return

    if (!silent) {
      setLoading(true)
      setError("")
    }

    try {
      const loadedQueue = await getQueueByBusiness(businessId)
      const loadedTickets = await getQueueTickets(loadedQueue.id)
      setQueue(loadedQueue)
      setTickets(loadedTickets)
    } catch (caughtError) {
      setQueue(null)
      setTickets([])
      if (!silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  async function loadClientTickets(silent = false) {
    if (!silent) {
      setLoading(true)
      setError("")
    }

    try {
      const loadedTickets = await getMyTickets()
      setTickets(loadedTickets)
    } catch (caughtError) {
      if (!silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  async function refreshTickets(silent = false) {
    if (effectiveMode === "MANAGER") {
      await loadManagerTickets(selectedBusinessId, silent)
    } else {
      await loadClientTickets(silent)
    }
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setActionLoading(true)
    setMessage("")
    setError("")

    try {
      await action()
      setMessage(successMessage)
      await refreshTickets()
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function openConversation(ticketId: number) {
    setActionLoading(true)
    setError("")

    try {
      const conversation = await getOrCreateConversation(ticketId)
      navigate(`/notifications?conversationId=${conversation.id}`)
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function loadWaitingInfo(ticketId: number) {
    setActionLoading(true)
    setError("")

    try {
      const info = await getWaitingInfo(ticketId)
      setWaitingInfo((current) => ({ ...current, [ticketId]: info }))
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  const counters = useMemo(
    () => ({
      waiting: tickets.filter((ticket) => ticket.status === "WAITING").length,
      serving: tickets.filter((ticket) => ticket.status === "SERVING").length,
      served: tickets.filter((ticket) => ticket.status === "SERVED").length,
      closed: tickets.filter((ticket) => ticket.status === "CANCELLED" || ticket.status === "NO_SHOW").length,
    }),
    [tickets],
  )

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Gestione ticket</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Ticket</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {effectiveMode === "MANAGER"
            ? "Controlla i ticket della coda selezionata e apri le conversazioni con i clienti."
            : "Segui i tuoi ticket, cancella quando consentito o posticipa il turno."}
        </p>
      </div>

      {message && <Alert kind="success" text={message} />}
      {error && <Alert kind="error" text={error} />}

      {effectiveMode === "MANAGER" && (
        <div className="panel-card rounded-3xl p-4 sm:p-5">
          <label className="block text-sm font-bold text-slate-200" htmlFor="ticket-business-select">
            Attività
          </label>
          <select
            id="ticket-business-select"
            value={selectedBusinessId ?? ""}
            onChange={(event) => setSelectedBusinessId(Number(event.target.value))}
            className="form-select mt-2"
          >
            {businesses.length === 0 && <option value="">Nessuna attività</option>}
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name} · {business.city}
              </option>
            ))}
          </select>
          {queue && (
            <p className="mt-3 text-sm text-slate-400">
              Coda #{queue.id} · numero corrente {queue.currentNumber || "—"}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="In attesa" value={counters.waiting} icon={<Clock />} />
        <StatusCard label="In servizio" value={counters.serving} icon={<UserCheck />} />
        <StatusCard label="Completati" value={counters.served} icon={<Ticket />} />
        <StatusCard label="Cancellati / no-show" value={counters.closed} icon={<XCircle />} />
      </div>

      <div className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Lista ticket</h3>
          {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
        </div>

        <div className="mt-6 space-y-3">
          {tickets.length === 0 && <EmptyState text="Nessun ticket caricato." />}
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              waitingInfo={waitingInfo[ticket.id]}
              isManager={effectiveMode === "MANAGER"}
              actionLoading={actionLoading}
              onCancel={() => runAction(() => cancelTicket(ticket.id), "Ticket cancellato.")}
              onSmartDelay={() => runAction(() => smartDelay(ticket.id, 3), "Ticket posticipato di tre posizioni.")}
              onWaitingInfo={() => loadWaitingInfo(ticket.id)}
              onComplete={() => runAction(() => completeTicket(ticket.id), "Ticket completato.")}
              onNoShow={() => runAction(() => markNoShow(ticket.id), "Ticket segnato come no-show.")}
              onUndoComplete={() => runAction(() => undoCompleteTicket(ticket.id), "Ticket ripristinato in servizio.")}
              onOpenConversation={() => openConversation(ticket.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatusCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="panel-card rounded-3xl p-4 sm:p-5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="font-bold text-white">{label}</p>
      <p className="mt-5 text-3xl font-bold text-white">{value}</p>
    </article>
  )
}

function TicketCard({
  ticket,
  waitingInfo,
  isManager,
  actionLoading,
  onCancel,
  onSmartDelay,
  onWaitingInfo,
  onComplete,
  onNoShow,
  onUndoComplete,
  onOpenConversation,
}: {
  ticket: TicketResponse
  waitingInfo?: WaitingInfoResponse
  isManager: boolean
  actionLoading: boolean
  onCancel: () => void
  onSmartDelay: () => void
  onWaitingInfo: () => void
  onComplete: () => void
  onNoShow: () => void
  onUndoComplete: () => void
  onOpenConversation: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 soft-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black text-white">#{ticket.ticketNumber}</p>
          <p className="mt-1 text-sm text-slate-400">
            {ticket.businessName} · Creato: {formatDateTime(ticket.createdAt)} · Persone davanti: {ticket.peopleBefore}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${ticketBadgeClass(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span>
      </div>

      {waitingInfo && (
        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
          Posizione: {waitingInfo.position || "—"} · Persone davanti: {waitingInfo.peopleBefore} · Stima: {waitingInfo.estimatedWaitingMinutes} minuti · Media
          servizio: {waitingInfo.averageServiceMinutes} minuti
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionLoading}
          onClick={onOpenConversation}
          className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
        >
          <MessageCircle className="size-4" /> Messaggi
        </button>

        {!isManager && (
          <>
            <button
              type="button"
              disabled={actionLoading || !ticket.canCancel}
              onClick={onCancel}
              className="action-button border border-red-300/20 bg-red-300/10 text-red-200 hover:bg-red-300/20"
            >
              Cancella
            </button>
            <button
              type="button"
              disabled={actionLoading || !ticket.canSmartDelay}
              onClick={onSmartDelay}
              className="action-button border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20"
            >
              <RotateCw className="size-4" /> Posticipa di 3
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onWaitingInfo}
              className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
            >
              Info attesa
            </button>
          </>
        )}

        {isManager && ticket.status === "SERVING" && (
          <>
            <button type="button" disabled={actionLoading} onClick={onComplete} className="action-button bg-emerald-400 text-slate-950 hover:bg-emerald-300">
              Completa
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onNoShow}
              className="action-button border border-red-300/20 bg-red-300/10 text-red-200 hover:bg-red-300/20"
            >
              No-show
            </button>
          </>
        )}

        {isManager && ticket.canUndoFinalization && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={onUndoComplete}
            className="action-button border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20"
          >
            Ripristina
          </button>
        )}
      </div>
    </div>
  )
}

function Alert({ kind, text }: { kind: "success" | "error"; text: string }) {
  const className = kind === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle

  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${className}`}>
      <Icon className="size-4" />
      {text}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{text}</div>
}
