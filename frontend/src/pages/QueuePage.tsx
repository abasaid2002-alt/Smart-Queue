/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from "react"
import { useLocation, useSearchParams } from "react-router"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Navigation,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  RotateCcwSquare,
  Store,
  Trash2,
  UnlockKeyhole,
  XCircle,
} from "lucide-react"
import {
  closeQueue,
  completeTicket,
  createBusiness,
  createTicket,
  deleteBusiness,
  getApiErrorMessage,
  getBusinesses,
  getMyBusinesses,
  getMyTickets,
  getQueueByBusiness,
  getQueueTickets,
  markNoShow,
  nextTicket,
  openQueue,
  resetQueue,
  undoCompleteTicket,
  undoNext,
  type BusinessResponse,
  type QueueResponse,
  type TicketResponse,
  updateBusiness,
} from "../lib/api"
import { getAuthUser } from "../lib/auth"
import { getEffectiveWorkspaceMode, useUserPreferences } from "../lib/preferences"
import {
  buildAppleMapsUrl,
  buildGoogleMapsUrl,
  buildWazeUrl,
  formatDistance,
  getBusinessAddressLabel,
  getCurrentPosition,
  sortBusinessesByDistance,
  type BusinessWithDistance,
} from "../lib/location"

type BusinessFormState = {
  name: string
  description: string
  address: string
  city: string
  category: string
  openingTime: string
  closingTime: string
}

const emptyBusinessForm: BusinessFormState = {
  name: "",
  description: "",
  address: "",
  city: "",
  category: "",
  openingTime: "",
  closingTime: "",
}

function formatDateTime(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatBusinessHours(openingTime?: string | null, closingTime?: string | null) {
  if (!openingTime || !closingTime) return "Orari non impostati"
  return `${openingTime} - ${closingTime}`
}

function isToday(value: string) {
  const date = new Date(value)
  const today = new Date()

  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
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

function queueStatusLabel(status: QueueResponse["status"]) {
  return status === "OPEN" ? "Aperta" : "Chiusa"
}

function queueBadgeClass(status: QueueResponse["status"]) {
  return status === "OPEN" ? "badge badge-success" : "badge badge-muted"
}

export function QueuePage() {
  const user = getAuthUser()
  const preferences = useUserPreferences()
  const effectiveMode = getEffectiveWorkspaceMode(user?.role, preferences.workspaceMode)

  if (effectiveMode === "CLIENT") {
    return <ClientQueue />
  }

  return <ManagerQueue />
}

function ManagerQueue() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as {
    openCreateBusinessForm?: boolean
    selectedBusinessId?: number
  } | null
  const businessIdFromUrl = Number(searchParams.get("businessId"))
  const selectedBusinessIdFromUrl = Number.isFinite(businessIdFromUrl) && businessIdFromUrl > 0 ? businessIdFromUrl : null
  const shouldOpenBusinessForm = Boolean(state?.openCreateBusinessForm)
  const initialSelectedBusinessId = selectedBusinessIdFromUrl ?? (typeof state?.selectedBusinessId === "number" ? state.selectedBusinessId : null)

  const [businesses, setBusinesses] = useState<BusinessResponse[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(initialSelectedBusinessId)
  const [queue, setQueue] = useState<QueueResponse | null>(null)
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [businessForm, setBusinessForm] = useState<BusinessFormState>(emptyBusinessForm)
  const [editingBusinessId, setEditingBusinessId] = useState<number | null>(null)
  const [showBusinessForm, setShowBusinessForm] = useState(shouldOpenBusinessForm)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void loadBusinesses(initialSelectedBusinessId ?? undefined)
  }, [])

  useEffect(() => {
    if (shouldOpenBusinessForm || initialSelectedBusinessId) {
      window.history.replaceState({}, document.title, initialSelectedBusinessId ? `/queue?businessId=${initialSelectedBusinessId}` : "/queue")
    }
  }, [shouldOpenBusinessForm, initialSelectedBusinessId])

  useEffect(() => {
    if (!selectedBusinessId) return

    void refreshQueue(selectedBusinessId)

    const intervalId = window.setInterval(() => {
      void refreshQueue(selectedBusinessId, { silent: true })
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [selectedBusinessId])

  async function loadBusinesses(selectBusinessId?: number) {
    setLoading(true)
    setError("")

    try {
      const loadedBusinesses = await getMyBusinesses()
      const preferredSelectedId = selectBusinessId ?? selectedBusinessId ?? loadedBusinesses[0]?.id ?? null
      const nextSelectedId = loadedBusinesses.some((business) => business.id === preferredSelectedId) ? preferredSelectedId : (loadedBusinesses[0]?.id ?? null)

      setBusinesses(loadedBusinesses)
      setSelectedBusinessId(nextSelectedId)

      if (!nextSelectedId) {
        setQueue(null)
        setTickets([])
      }
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  async function refreshQueue(businessId = selectedBusinessId, options: { silent?: boolean } = {}) {
    if (!businessId) return

    if (!options.silent) {
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
      if (!options.silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!options.silent) {
        setLoading(false)
      }
    }
  }

  async function handleSaveBusiness(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionLoading(true)
    setMessage("")
    setError("")

    try {
      const payload = {
        name: businessForm.name.trim(),
        description: businessForm.description.trim(),
        address: businessForm.address.trim(),
        city: businessForm.city.trim(),
        category: businessForm.category.trim(),
        openingTime: businessForm.openingTime,
        closingTime: businessForm.closingTime,
      }

      const savedBusiness = editingBusinessId ? await updateBusiness(editingBusinessId, payload) : await createBusiness(payload)

      setBusinessForm(emptyBusinessForm)
      setEditingBusinessId(null)
      setShowBusinessForm(false)
      setMessage(editingBusinessId ? "Attività aggiornata." : "Attività creata. La coda è pronta.")
      await loadBusinesses(savedBusiness.id)
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  function selectBusiness(businessId: number) {
    setSelectedBusinessId(businessId)
    setMessage("")
    setError("")
    if (editingBusinessId && editingBusinessId !== businessId) {
      setBusinessForm(emptyBusinessForm)
      setEditingBusinessId(null)
      setShowBusinessForm(false)
    }
    window.history.replaceState({}, document.title, `/queue?businessId=${businessId}`)
  }

  function startCreateBusiness() {
    setBusinessForm(emptyBusinessForm)
    setEditingBusinessId(null)
    setShowBusinessForm(true)
    setMessage("")
    setError("")
  }

  function startEditBusiness(business: BusinessResponse) {
    setBusinessForm({
      name: business.name,
      description: business.description,
      address: business.address,
      city: business.city,
      category: business.category,
      openingTime: business.openingTime ?? "",
      closingTime: business.closingTime ?? "",
    })
    setEditingBusinessId(business.id)
    setSelectedBusinessId(business.id)
    setShowBusinessForm(true)
    setMessage("")
    setError("")
    window.history.replaceState({}, document.title, `/queue?businessId=${business.id}`)
  }

  function resetBusinessForm() {
    setBusinessForm(emptyBusinessForm)
    setEditingBusinessId(null)
    setShowBusinessForm(false)
  }

  async function handleDeleteBusiness(business: BusinessResponse) {
    const confirmed = window.confirm(`Vuoi eliminare ${business.name}? Non sarà più visibile ai clienti e la coda verrà chiusa.`)

    if (!confirmed) return

    setActionLoading(true)
    setMessage("")
    setError("")

    try {
      await deleteBusiness(business.id)
      setMessage("Attività eliminata. Lo storico resta conservato.")
      if (selectedBusinessId === business.id) {
        setSelectedBusinessId(null)
        setQueue(null)
        setTickets([])
      }
      await loadBusinesses(selectedBusinessId === business.id ? undefined : (selectedBusinessId ?? undefined))
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setActionLoading(true)
    setMessage("")
    setError("")

    try {
      await action()
      setMessage(successMessage)
      await refreshQueue()
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  const selectedBusiness = useMemo(() => businesses.find((business) => business.id === selectedBusinessId) ?? null, [businesses, selectedBusinessId])
  const servingTicket = useMemo(() => tickets.find((ticket) => ticket.status === "SERVING") ?? null, [tickets])
  const waitingTickets = useMemo(() => tickets.filter((ticket) => ticket.status === "WAITING"), [tickets])

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Gestione attività"
          title="Attività e code"
          description="Scegli un’attività, modifica i dati quando serve e gestisci la sua coda in modo ordinato."
        />

        <button
          type="button"
          onClick={showBusinessForm && !editingBusinessId ? resetBusinessForm : startCreateBusiness}
          className="action-button bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto"
        >
          <Plus className="size-4" />
          {showBusinessForm && !editingBusinessId ? "Chiudi" : "Nuova attività"}
        </button>
      </div>

      {message && <Alert kind="success" text={message} />}
      {error && <Alert kind="error" text={error} />}

      <div className="panel-card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Le tue attività</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Ogni attività ha orari, indirizzo e coda separati.</p>
          </div>
          {loading && <span className="text-xs font-semibold text-cyan-300">Aggiornamento...</span>}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {showBusinessForm && !editingBusinessId && (
            <div className="sm:col-span-2 xl:col-span-3">
              <BusinessForm
                form={businessForm}
                editing={false}
                actionLoading={actionLoading}
                onChange={setBusinessForm}
                onCancel={resetBusinessForm}
                onSubmit={handleSaveBusiness}
              />
            </div>
          )}

          {businesses.length === 0 && !showBusinessForm && <EmptyState text="Nessuna attività creata. Premi Nuova attività per iniziare." />}

          {businesses.map((business) => {
            const isSelected = business.id === selectedBusinessId
            const isEditingThisBusiness = showBusinessForm && editingBusinessId === business.id

            return (
              <div key={business.id} className="contents">
                <article
                  className={`soft-card-hover rounded-3xl border p-4 text-left transition ${
                    isSelected ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-slate-900/55 hover:bg-white/[0.06]"
                  }`}
                >
                  <button type="button" onClick={() => selectBusiness(business.id)} aria-pressed={isSelected} className="block w-full text-left">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                        <Store className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-white">{business.name}</span>
                        <span className="mt-1 block truncate text-sm text-slate-400">
                          {business.category} · {business.city}
                        </span>
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">{business.address}</p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                      <Clock3 className="size-3.5" />
                      {formatBusinessHours(business.openingTime, business.closingTime)}
                    </span>
                  </button>

                  <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSelected ? (
                        <span className="badge badge-primary px-2.5 py-1 text-xs font-bold">Selezionata</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">Premi per selezionare</span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => startEditBusiness(business)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
                        >
                          <Pencil className="size-3.5" />
                          Modifica
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleDeleteBusiness(business)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-300/20 bg-red-300/10 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" />
                          Elimina
                        </button>
                      </div>
                    )}
                  </div>
                </article>

                {isEditingThisBusiness && (
                  <div className="sm:col-span-2 xl:col-span-3">
                    <BusinessForm
                      form={businessForm}
                      editing
                      actionLoading={actionLoading}
                      onChange={setBusinessForm}
                      onCancel={resetBusinessForm}
                      onSubmit={handleSaveBusiness}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {queue && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard title="Stato coda" value={queueStatusLabel(queue.status)} badgeClass={queueBadgeClass(queue.status)} />
          <InfoCard title="Attività" value={selectedBusiness?.name ?? queue.businessName} />
          <InfoCard title="Numero corrente" value={queue.currentNumber || "—"} />
          <InfoCard title="In attesa" value={waitingTickets.length} />
        </div>
      )}

      {queue?.availabilityMessage && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">{queue.availabilityMessage}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QueueAction
          title="Manda avanti"
          description="Chiama il prossimo ticket."
          icon={<Play />}
          disabled={!queue || actionLoading}
          onClick={() => queue && runAction(() => nextTicket(queue.id), "Prossimo ticket chiamato.")}
        />
        <QueueAction
          title="Annulla"
          description="Ripristina l’ultima chiamata."
          icon={<RotateCcwSquare />}
          disabled={!queue || actionLoading}
          onClick={() => queue && runAction(() => undoNext(queue.id), "Ultima azione annullata.")}
        />
        <QueueAction
          title="Sospendi"
          description="Blocca nuovi ticket."
          icon={<LockKeyhole />}
          disabled={!queue || queue.status === "CLOSED" || actionLoading}
          onClick={() => queue && runAction(() => closeQueue(queue.id), "Coda sospesa.")}
        />
        <QueueAction
          title="Riattiva"
          description="Riapre se dentro orario."
          icon={<UnlockKeyhole />}
          disabled={!queue || queue.status === "OPEN" || actionLoading}
          onClick={() => queue && runAction(() => openQueue(queue.id), "Coda riattivata.")}
        />
        <QueueAction
          title="Reset"
          description="Ripulisce la coda corrente."
          icon={<RotateCcw />}
          disabled={!queue || actionLoading}
          onClick={() => queue && runAction(() => resetQueue(queue.id), "Coda resettata.")}
        />
      </div>

      <div className="panel-card rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Ticket in coda</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Gestisci il ticket in servizio e quelli in attesa.</p>
          </div>
          {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
        </div>

        <div className="mt-5 space-y-3">
          {!selectedBusiness && <EmptyState text="Seleziona o crea un’attività per gestire la sua coda." />}
          {selectedBusiness && !queue && <EmptyState text="Coda non disponibile. Aggiorna la pagina o controlla l’attività selezionata." />}
          {queue && tickets.length === 0 && <EmptyState text="La coda è vuota." />}
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              actionLoading={actionLoading}
              onComplete={() => runAction(() => completeTicket(ticket.id), "Ticket completato.")}
              onNoShow={() => runAction(() => markNoShow(ticket.id), "Ticket segnato come no-show.")}
              onUndoComplete={() => runAction(() => undoCompleteTicket(ticket.id), "Ticket ripristinato in servizio.")}
            />
          ))}
        </div>
      </div>

      {servingTicket && (
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-50">
          <p className="font-bold">Ticket in servizio: #{servingTicket.ticketNumber}</p>
          <p className="mt-1 text-sm text-cyan-100/80">Cliente: {servingTicket.userName}. Puoi completarlo, segnarlo no-show o ripristinarlo.</p>
        </div>
      )}
    </section>
  )
}

function BusinessForm({
  form,
  editing,
  actionLoading,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: BusinessFormState
  editing: boolean
  actionLoading: boolean
  onChange: (nextForm: BusinessFormState) => void
  onCancel: () => void
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="panel-card scroll-mt-24 rounded-3xl border-cyan-300/20 bg-cyan-300/5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <Plus className="size-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-white">{editing ? "Modifica attività" : "Nuova attività"}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Compila solo i dati utili al cliente: nome, indirizzo e orari.</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 sm:w-auto">
          Chiudi
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Nome attività">
          <input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            className="form-input"
            placeholder="Esempio: Bar Centrale"
            required
          />
        </Field>

        <Field label="Descrizione">
          <textarea
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            className="form-input min-h-24 resize-none"
            placeholder="Descrivi in poche parole il servizio offerto."
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Indirizzo">
            <input
              value={form.address}
              onChange={(event) => onChange({ ...form, address: event.target.value })}
              className="form-input"
              placeholder="Via e numero civico"
              required
            />
          </Field>
          <Field label="Città">
            <input
              value={form.city}
              onChange={(event) => onChange({ ...form, city: event.target.value })}
              className="form-input"
              placeholder="Milano"
              required
            />
          </Field>
        </div>

        <Field label="Categoria">
          <input
            value={form.category}
            onChange={(event) => onChange({ ...form, category: event.target.value })}
            className="form-input"
            placeholder="Bar, ufficio, negozio..."
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Orario apertura">
            <input
              type="time"
              value={form.openingTime}
              onChange={(event) => onChange({ ...form, openingTime: event.target.value })}
              className="form-input"
              required
            />
          </Field>
          <Field label="Orario chiusura">
            <input
              type="time"
              value={form.closingTime}
              onChange={(event) => onChange({ ...form, closingTime: event.target.value })}
              className="form-input"
              required
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <button type="submit" disabled={actionLoading} className="action-button bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          {actionLoading ? "Salvataggio..." : editing ? "Aggiorna attività" : "Salva attività"}
        </button>
        <button type="button" onClick={onCancel} className="action-button border border-white/10 bg-white/[0.04] text-white hover:bg-white/10">
          Annulla
        </button>
      </div>
    </form>
  )
}

function ClientQueue() {
  const user = getAuthUser()
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([])
  const [queuesByBusinessId, setQueuesByBusinessId] = useState<Record<number, QueueResponse>>({})
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [latestTicket, setLatestTicket] = useState<TicketResponse | null>(null)
  const [myTickets, setMyTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationSortingEnabled, setLocationSortingEnabled] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    void loadClientData({ silent: false, ignore })

    const intervalId = window.setInterval(() => {
      void loadClientData({ silent: true, ignore })
    }, 5000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [user?.id, user?.role, locationSortingEnabled])

  async function loadClientData({ silent, ignore }: { silent: boolean; ignore?: boolean }) {
    if (!silent) {
      setLoading(true)
      setError("")
    }

    try {
      const allBusinesses = (await getBusinesses()).filter((business) => user?.role !== "MANAGER" || business.ownerId !== user.id)
      const checkedBusinesses = await Promise.all(
        allBusinesses.map(async (business) => {
          try {
            const businessQueue = await getQueueByBusiness(business.id)
            return businessQueue.status === "OPEN" ? { business, queue: businessQueue } : null
          } catch {
            return null
          }
        }),
      )

      const availablePairs = checkedBusinesses.filter((item): item is { business: BusinessResponse; queue: QueueResponse } => item !== null)
      const availableBusinesses = availablePairs.map(({ business }) => business)
      const loadedQueuesByBusinessId = availablePairs.reduce<Record<number, QueueResponse>>((accumulator, { business, queue }) => {
        accumulator[business.id] = queue
        return accumulator
      }, {})
      const loadedTickets = await getMyTickets()
      let nextBusinesses: BusinessWithDistance[] = availableBusinesses.sort((firstBusiness, secondBusiness) =>
        firstBusiness.name.localeCompare(secondBusiness.name, "it"),
      )
      let nextLocationMessage = availableBusinesses.length > 0 ? "Attività aperte ordinate per nome. Puoi usare la posizione per vedere le più vicine." : ""

      if (locationSortingEnabled && availableBusinesses.length > 0) {
        try {
          const userPosition = await getCurrentPosition()
          nextBusinesses = await sortBusinessesByDistance(availableBusinesses, userPosition)
          nextLocationMessage = "Attività aggiornate e ordinate dalla più vicina alla più lontana."
        } catch {
          nextLocationMessage = "Posizione non disponibile. Le attività restano ordinate per nome."
        }
      }

      if (!ignore) {
        setBusinesses(nextBusinesses)
        setQueuesByBusinessId(loadedQueuesByBusinessId)
        setMyTickets(loadedTickets)
        setSelectedBusinessId((currentSelectedId) => {
          if (currentSelectedId && nextBusinesses.some((business) => business.id === currentSelectedId)) return currentSelectedId
          return nextBusinesses[0]?.id ?? null
        })
        if (!silent || locationSortingEnabled) {
          setLocationMessage(nextLocationMessage)
        }
      }
    } catch (caughtError) {
      if (!ignore && !silent) {
        setError(getApiErrorMessage(caughtError))
      }
    } finally {
      if (!ignore && !silent) {
        setLoading(false)
      }
    }
  }

  async function refreshClientData() {
    await loadClientData({ silent: true })
  }

  async function handleUseLocation() {
    if (businesses.length === 0) return

    setLocationLoading(true)
    setLocationMessage("")
    setError("")

    try {
      const userPosition = await getCurrentPosition()
      const sortedBusinesses = await sortBusinessesByDistance(businesses, userPosition)
      setBusinesses(sortedBusinesses)
      setLocationSortingEnabled(true)
      setLocationMessage("Attività ordinate dalla più vicina alla più lontana.")
    } catch {
      setLocationSortingEnabled(false)
      setLocationMessage("Posizione non disponibile. Le attività restano ordinate per nome.")
    } finally {
      setLocationLoading(false)
    }
  }

  async function handleCreateTicket(queueToUse: QueueResponse, businessId: number) {
    const ticketForBusinessToday = myTickets.find((ticket) => ticket.businessId === businessId && isToday(ticket.createdAt))
    if (ticketForBusinessToday) return

    setActionLoading(true)
    setMessage("")
    setError("")

    try {
      const createdTicket = await createTicket(queueToUse.id)
      setLatestTicket(createdTicket)
      setMyTickets((currentTickets) => [createdTicket, ...currentTickets])
      setMessage(`Numero preso: #${createdTicket.ticketNumber}`)
      await refreshClientData()
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <section className="flex flex-col gap-5 text-left sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Area cliente" title="Prendi un numero" description="Scegli un’attività aperta e genera il tuo ticket digitale." />

        <button
          type="button"
          onClick={handleUseLocation}
          disabled={businesses.length === 0 || locationLoading}
          className="action-button border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-60 sm:w-auto"
        >
          <LocateFixed className="size-4" />
          {locationLoading ? "Controllo posizione..." : locationSortingEnabled ? "Aggiorna distanza" : "Ordina per distanza"}
        </button>
      </div>

      {user?.role === "MANAGER" && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-100">
          Stai usando Smart Queue come cliente. Le tue attività non sono prenotabili da questo profilo.
        </div>
      )}

      {message && <Alert kind="success" text={message} />}
      {error && <Alert kind="error" text={error} />}

      <div className="panel-card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Attività aperte</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Tutto è in una sola scheda: indirizzo, stato coda e pulsante per prendere il numero.</p>
          </div>
          {loading && <span className="text-xs font-semibold text-cyan-300">Caricamento...</span>}
        </div>

        {locationMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs leading-5 text-slate-400">
            <LocateFixed className="mt-0.5 size-4 shrink-0 text-cyan-300" />
            <span>{locationMessage}</span>
          </div>
        )}

        <div className="mt-5 grid gap-4">
          {!loading && businesses.length === 0 && <EmptyState text="Non ci sono attività aperte in questo momento." />}

          {businesses.map((business) => {
            const queueForBusiness = queuesByBusinessId[business.id]
            const isSelected = business.id === selectedBusinessId
            const businessDistance = formatDistance(business.distanceKm)
            const ticketForBusinessToday = myTickets.find((ticket) => ticket.businessId === business.id && isToday(ticket.createdAt))
            const canCreateTicket = queueForBusiness?.status === "OPEN" && !ticketForBusinessToday && !actionLoading

            return (
              <article
                key={business.id}
                className={`soft-card-hover rounded-3xl border p-4 transition sm:p-5 ${
                  isSelected ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-slate-900/55 hover:bg-white/[0.06]"
                }`}
              >
                <button type="button" onClick={() => setSelectedBusinessId(business.id)} className="block w-full text-left" aria-pressed={isSelected}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                      <Store className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-white">{business.name}</span>
                      <span className="mt-1 block truncate text-sm text-slate-400">
                        {business.category} · {business.city}
                        {businessDistance ? ` · ${businessDistance}` : ""}
                      </span>
                    </span>
                    <Navigation className="size-5 shrink-0 text-cyan-300" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="badge badge-success px-2.5 py-1 text-xs font-bold">Aperta</span>
                    {isSelected && <span className="badge badge-primary px-2.5 py-1 text-xs font-bold">Selezionata</span>}
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                      <Clock3 className="size-3.5" />
                      {formatBusinessHours(business.openingTime, business.closingTime)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{getBusinessAddressLabel(business) || business.address}</p>
                </button>

                {isSelected && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <a
                      href={buildGoogleMapsUrl(business)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                    >
                      <MapPin className="size-4" />
                      {getBusinessAddressLabel(business) || "Apri indirizzo"}
                    </a>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <MapButton href={buildGoogleMapsUrl(business)} label="Google Maps" />
                      <MapButton href={buildAppleMapsUrl(business)} label="Mappe" />
                      <MapButton href={buildWazeUrl(business)} label="Waze" />
                    </div>

                    {queueForBusiness && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <InfoCard title="Stato" value={queueStatusLabel(queueForBusiness.status)} badgeClass={queueBadgeClass(queueForBusiness.status)} />
                        <InfoCard title="Numero corrente" value={queueForBusiness.currentNumber || "—"} />
                        <InfoCard title="Ultimo numero" value={queueForBusiness.lastNumber} />
                      </div>
                    )}

                    {queueForBusiness?.availabilityMessage && (
                      <p className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs leading-5 text-slate-400">
                        {queueForBusiness.availabilityMessage}
                      </p>
                    )}

                    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-black text-white">Ticket digitale</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-400">Prendi il numero e segui l’avanzamento dalla pagina Ticket.</p>
                        </div>
                        <button
                          type="button"
                          disabled={!canCreateTicket || loading}
                          onClick={() => queueForBusiness && handleCreateTicket(queueForBusiness, business.id)}
                          className="action-button bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoading
                            ? "Creazione..."
                            : ticketForBusinessToday
                              ? `Ticket #${ticketForBusinessToday.ticketNumber} già preso`
                              : "Prendi numero"}
                        </button>
                      </div>

                      {ticketForBusinessToday && (
                        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
                          Hai già preso questo ticket oggi. Puoi seguirlo dalla pagina Ticket.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>

      {latestTicket && (
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
          <p className="text-sm font-semibold text-emerald-200">Ticket creato</p>
          <h3 className="mt-2 text-4xl font-black text-white">#{latestTicket.ticketNumber}</h3>
          <p className="mt-2 text-sm text-emerald-100/80">
            Persone davanti: {latestTicket.peopleBefore}. Creato il {formatDateTime(latestTicket.createdAt)}.
          </p>
        </div>
      )}
    </section>
  )
}

function MapButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
    >
      {label}
    </a>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-200">{label}</span>
      {children}
    </label>
  )
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

function QueueAction({
  title,
  description,
  icon,
  disabled,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="soft-card-hover rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 sm:p-5"
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </button>
  )
}

function TicketRow({
  ticket,
  actionLoading,
  onComplete,
  onNoShow,
  onUndoComplete,
}: {
  ticket: TicketResponse
  actionLoading: boolean
  onComplete: () => void
  onNoShow: () => void
  onUndoComplete: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-black text-white">#{ticket.ticketNumber}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Cliente: {ticket.userName} · Creato: {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <span className={`badge px-3 py-1 text-xs font-bold ${ticketBadgeClass(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ticket.status === "SERVING" && (
          <>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onComplete}
              className="action-button bg-emerald-400 text-slate-950 hover:bg-emerald-300 sm:w-auto"
            >
              <CheckCircle2 className="size-4" /> Completa
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onNoShow}
              className="action-button border border-red-300/20 bg-red-300/10 text-red-200 hover:bg-red-300/20 sm:w-auto"
            >
              <XCircle className="size-4" /> No-show
            </button>
          </>
        )}
        {ticket.canUndoFinalization && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={onUndoComplete}
            className="action-button border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20 sm:w-auto"
          >
            <RotateCcwSquare className="size-4" /> Ripristina
          </button>
        )}
      </div>
    </div>
  )
}

function InfoCard({ title, value, badgeClass }: { title: string; value: string | number; badgeClass?: string }) {
  return (
    <article className="panel-card rounded-3xl p-4 sm:p-5">
      <p className="text-sm text-slate-400">{title}</p>
      {badgeClass ? (
        <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${badgeClass}`}>{value}</span>
      ) : (
        <p className="mt-3 break-words text-2xl font-black text-white sm:text-3xl">{value}</p>
      )}
    </article>
  )
}

function Alert({ kind, text }: { kind: "success" | "error"; text: string }) {
  const className = kind === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle

  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm leading-6 ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-7 text-center text-sm leading-6 text-slate-500 sm:col-span-full">
      {text}
    </div>
  )
}
