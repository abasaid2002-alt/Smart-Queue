/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type ReactNode } from "react"
import { BarChart3, Clock3, RotateCw, TicketCheck, Users, XCircle } from "lucide-react"
import { getApiErrorMessage, getMyBusinesses, getQueueAnalytics, getQueueByBusiness, type BusinessResponse, type ManagerAnalyticsResponse } from "../lib/api"
import { getAuthUser } from "../lib/auth"
import { getEffectiveWorkspaceMode, useUserPreferences } from "../lib/preferences"

export function AnalyticsPage() {
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [analytics, setAnalytics] = useState<ManagerAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadBusinesses() {
    setLoading(true)
    setError("")

    try {
      const loadedBusinesses = await getMyBusinesses()
      setBusinesses(loadedBusinesses)
      setSelectedBusinessId((current) => current ?? loadedBusinesses[0]?.id ?? null)
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics(businessId: number) {
    setLoading(true)
    setError("")

    try {
      const queue = await getQueueByBusiness(businessId)
      const loadedAnalytics = await getQueueAnalytics(queue.id)
      setAnalytics(loadedAnalytics)
    } catch (caughtError) {
      setAnalytics(null)
      setError(getApiErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveMode !== "MANAGER") {
      setLoading(false)
      return
    }

    void loadBusinesses()
  }, [effectiveMode])

  useEffect(() => {
    if (!selectedBusinessId || effectiveMode !== "MANAGER") return
    void loadAnalytics(selectedBusinessId)
  }, [selectedBusinessId, effectiveMode])

  if (effectiveMode !== "MANAGER") {
    return (
      <section className="flex flex-col gap-5 text-left sm:gap-6">
        <PageHeader />
        <div className="panel-card rounded-3xl p-6 text-sm leading-6 text-slate-400">
          Le statistiche sono disponibili in modalità manager. Puoi seguire lo stato dei tuoi ticket dalla pagina Ticket.
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <PageHeader />

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="panel-card rounded-3xl p-4 sm:p-5">
        <label className="block text-sm font-bold text-slate-200" htmlFor="analytics-business-select">
          Attività
        </label>
        <select
          id="analytics-business-select"
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Ticket in attesa" value={analytics?.waitingTickets ?? 0} icon={<Users />} />
        <AnalyticsCard label="Ticket completati oggi" value={analytics?.completedToday ?? 0} icon={<TicketCheck />} />
        <AnalyticsCard label="Tempo medio attesa" value={`${analytics?.averageWaitingMinutes ?? 0} min`} icon={<Clock3 />} />
        <AnalyticsCard label="Posticipi usati oggi" value={analytics?.smartDelayUsedToday ?? 0} icon={<RotateCw />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsCard label="In servizio" value={analytics?.servingTickets ?? 0} icon={<BarChart3 />} />
        <AnalyticsCard label="Cancellati oggi" value={analytics?.cancelledToday ?? 0} icon={<XCircle />} />
        <AnalyticsCard label="No-show oggi" value={analytics?.noShowToday ?? 0} icon={<XCircle />} />
      </div>

      <div className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6 text-cyan-300" />
          <h3 className="text-lg font-bold text-white">Report coda</h3>
        </div>

        {loading && <p className="mt-4 text-sm text-cyan-300">Caricamento statistiche...</p>}
        {!loading && !analytics && <EmptyState text="Nessun dato disponibile per questa attività." />}
        {analytics && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm leading-6 text-slate-300">
            <p>
              Coda di <span className="font-bold text-white">{analytics.businessName}</span>: numero corrente {analytics.currentNumber || "—"}, ultimo numero
              generato {analytics.lastNumber}.
            </p>
            <p className="mt-2">Tempo medio servizio: {analytics.averageServiceMinutes} minuti.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function PageHeader() {
  return (
    <div>
      <p className="text-sm font-semibold text-cyan-300">Statistiche attività</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Statistiche</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Controlla attese, ticket completati, cancellazioni, no-show e Posticipi.</p>
    </div>
  )
}

function AnalyticsCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <article className="panel-card rounded-3xl p-4 sm:p-5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </article>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{text}</div>
}
